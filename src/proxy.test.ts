import { createSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/app/api/_data/auth-cookies';
import { PROTECTED_ROUTES } from '@/shared/config/routes';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from './proxy';

/**
 * 보호 경로 가드 (단위)
 *
 * proxy 함수를 직접 부른다. 실제 요청 경계에서 이 리다이렉트가 일어나는지는
 * 여기서 증명되지 않는다 — 그건 E2E 의 몫이고, 5단계 뮤테이션도 그쪽에서 잡는다.
 * 여기서 지키는 것은 "어떤 경로를 막고 어떤 쿼리를 붙이는가"라는 판정 규칙이다.
 *
 * 이 한계는 실제로 물렸던 것이다. 함수 이름이 `middleware` 였을 때 이 파일의 테스트는
 * 전부 통과했지만 Next 는 그 파일을 아예 인식하지 못했다. 이름과 등록 여부는
 * pnpm build 와 pnpm start 로만 확인된다.
 *
 * 쿠키는 존재 여부만 만든다. 서명을 검증하지 않기로 한 결정 때문에 값이 무엇이든 결과가 같다.
 */
const requestTo = (pathname: string, { session }: { session?: string } = {}): NextRequest => {
  const request = new NextRequest(`http://localhost${pathname}`);

  if (session !== undefined) {
    request.cookies.set(SESSION_COOKIE, session);
  }

  return request;
};

const liveSession = () => createSessionToken('u1');

/** TTL 을 1초 넘긴 시점에 발급된 토큰. 서버라면 401 을 줄 값이다. */
const expiredSession = () => createSessionToken('u1', Date.now() - (SESSION_TTL_SECONDS + 1) * 1_000);

const locationOf = (pathname: string, options?: { session: string }) => {
  const location = proxy(requestTo(pathname, options)).headers.get('location');

  return location === null ? null : new URL(location);
};

describe('보호 경로 가드', () => {
  // 보호 목록 밖은 전부 통과다. 화이트리스트가 아니라 블랙리스트라는 결정이 여기 드러난다.
  // 마지막 값은 라우트가 없는 경로다 — proxy 는 존재 여부를 묻지 않는다.
  describe('보호 목록에 없는 경로는 세션 없이도 그대로 지나간다', () => {
    it.each(['/', '/products', '/products/p1', '/login', '/아직-없는-경로'])(
      '%s 로 들어온 요청을 돌려보내지 않는다',
      (pathname) => {
        expect(locationOf(pathname)).toBeNull();
      },
    );
  });

  describe('보호 경로에 세션 없이 들어오면', () => {
    it.each(['/order', '/orders', '/mypage'])('%s 를 원래 경로로 실어 로그인 화면으로 보낸다', (pathname) => {
      const location = locationOf(pathname);

      expect(location?.pathname).toBe('/login');
      expect(location?.searchParams.get('returnTo')).toBe(pathname);
      expect(location?.searchParams.get('reason')).toBe('required');
    });

    // 목록 2페이지에서 튕겨 온 사람을 1페이지로 돌려보내지 않는다
    it('쿼리가 붙은 경로면 그 쿼리까지 복원 대상에 담는다', () => {
      const location = locationOf('/orders?page=2');

      expect(location?.searchParams.get('returnTo')).toBe('/orders?page=2');
    });

    // 원래 쿼리는 returnTo 안에만 담는다. 로그인 URL 에 그대로 남으면 주소가 지저분해지고
    // reason·returnTo 외의 값이 로그인 화면까지 따라온다
    it('원래 쿼리를 로그인 URL 에 남기지 않는다', () => {
      const location = locationOf('/orders?page=2');

      expect([...(location?.searchParams.keys() ?? [])].sort()).toEqual(['reason', 'returnTo']);
    });

    // 하위 경로도 보호 대상이다. /orders 만 막고 /orders/1 이 열리면 가드가 뚫린다
    it('보호 경로의 하위 경로도 막는다', () => {
      expect(locationOf('/orders/o1')?.pathname).toBe('/login');
    });

    // 경계 — 접두사만 같은 경로까지 막으면 공개 화면이 잠긴다
    it('이름이 겹치기만 하는 다른 경로는 막지 않는다', () => {
      expect(locationOf('/ordersomething')).toBeNull();
    });
  });

  describe('보호 경로에 세션을 갖고 들어오면', () => {
    it.each(['/order', '/orders', '/mypage'])('%s 를 그대로 통과시킨다', (pathname) => {
      expect(locationOf(pathname, { session: liveSession() })).toBeNull();
    });
  });

  // 만료 판정은 여기서 하지 않기로 한 결정이 코드로 지켜지는지 본다.
  // 서버라면 401 을 줄 토큰인데도 proxy 는 묻지 않고 통과시킨다. 나중에 여기서 토큰을
  // 검증하기 시작하면 이 케이스가 실패해, 결정이 바뀌었음을 알린다.
  it('서버가 거절할 만료된 세션이어도 쿠키가 있으면 통과시킨다', () => {
    expect(locationOf('/orders', { session: expiredSession() })).toBeNull();
  });

  /**
   * matcher 는 Next 가 컴파일 타임에 파싱해야 해서 PROTECTED_ROUTES 에서 파생시키지 못하고
   * 손으로 적혀 있다. 목록이 늘었을 때 matcher 를 빠뜨리면 가드 함수는 멀쩡한데
   * Next 가 그 경로에 proxy 를 아예 태우지 않아 화면이 그냥 열린다.
   * 위 테스트들은 함수를 직접 부르므로 그 상태에서도 전부 통과한다 — 그래서 여기서 대조한다.
   */
  it('matcher 가 보호 경로 목록을 빠짐없이 덮는다', () => {
    const expected = PROTECTED_ROUTES.flatMap((route) => [route, `${route}/:path*`]);

    expect([...config.matcher].sort()).toEqual([...expected].sort());
  });
});
