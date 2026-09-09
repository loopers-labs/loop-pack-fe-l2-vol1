import type { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from './queryClient';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { ApiError, UNAUTHORIZED_STATUS } from '@/shared/api/response';
import type { AuthUser } from '@/entities/session/model/session';

/**
 * 401을 만료로 다룰 범위를 검증한다.
 *
 * 모든 401을 만료로 처리하면 비밀번호를 틀렸을 뿐인데 "세션이 만료되었습니다"가 뜨고,
 * 공개 조회가 다른 사유로 401을 받아도 로그인 화면으로 밀려난다. 그래서 인증이 필요한
 * 요청에만 `meta.authRequired`를 붙이고 전역 처리기는 그 표시가 있는 401만 다룬다.
 */

const LOGGED_IN_USER: AuthUser = { id: 'u1', name: '루퍼1', email: 'looper1@loopers.dev' };

function createRouterSpy() {
  return {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
}

type RouterSpy = ReturnType<typeof createRouterSpy>;

function setup() {
  const router = createRouterSpy();
  const client = createQueryClient((path) => router.replace(path));
  return { router, client };
}

/** 조회 하나를 실패시킨다. `authRequired`가 없으면 공개 조회다 */
async function failQuery(
  client: QueryClient,
  error: unknown,
  options: { authRequired?: boolean } = {},
) {
  await client
    .fetchQuery({
      queryKey: ['probe', Math.random()],
      queryFn: () => Promise.reject(error),
      retry: false,
      ...(options.authRequired ? { meta: { authRequired: true } } : {}),
    })
    .catch(() => undefined);
}

/** 변경 요청 하나를 실패시킨다. `authRequired`가 없으면 로그인 요청 같은 공개 변경이다 */
async function failMutation(
  client: QueryClient,
  error: unknown,
  options: { authRequired?: boolean } = {},
) {
  const mutation = client.getMutationCache().build(client, {
    mutationFn: () => Promise.reject(error),
    retry: false,
    ...(options.authRequired ? { meta: { authRequired: true } } : {}),
  });

  await mutation.execute(undefined).catch(() => undefined);
}

/** 서버가 만료·미로그인 양쪽에 쓰는 응답. 의미 구분은 이 상태 코드만으로는 되지 않는다 */
const unauthorized = () => new ApiError(UNAUTHORIZED_STATUS, '로그인이 필요합니다.');

/** 401이 아닌 서버 실패 — 만료로 다루면 안 되는 쪽 */
const SERVER_ERROR_STATUS = 500;

describe('401을 만료로 다룰 범위', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/orders/new?from=cart');
  });

  it('인증이 필요한 조회의 401이면 로그인으로 보낸다', async () => {
    const { router, client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    await failQuery(client, unauthorized(), { authRequired: true });

    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('공개 조회의 401이면 이동하지 않는다', async () => {
    const { router, client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    await failQuery(client, unauthorized());

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('인증이 필요한 변경 요청의 401이면 로그인으로 보낸다', async () => {
    const { router, client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    await failMutation(client, unauthorized(), { authRequired: true });

    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  // 로그인 요청의 401은 자격 증명 불일치라 만료가 아니다. 폼이 직접 문구를 보여준다
  it('로그인 요청의 401이면 이동하지 않는다', async () => {
    const { router, client } = setup();

    await failMutation(client, unauthorized());

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('401이 아닌 실패는 인증이 필요한 요청이어도 이동하지 않는다', async () => {
    const { router, client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    await failQuery(client, new ApiError(SERVER_ERROR_STATUS, '주문 정보를 처리하지 못했습니다.'), {
      authRequired: true,
    });
    await failQuery(client, new Error('네트워크에 연결하지 못했습니다.'), { authRequired: true });

    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('로그인으로 보낼 때 만드는 경로', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/orders/new?from=cart');
  });

  it('직전에 로그인 상태였으면 만료로 표시하고 현재 경로를 쿼리까지 싣는다', async () => {
    const { router, client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    await failQuery(client, unauthorized(), { authRequired: true });

    expect(router.replace).toHaveBeenCalledWith(
      '/login?next=%2Forders%2Fnew%3Ffrom%3Dcart&expired=1',
    );
  });

  // 로그인한 적이 없다면 만료가 아니라 미로그인이다 — 안내 문구가 달라져야 한다
  it('직전에 로그인 상태가 아니었으면 만료로 표시하지 않는다', async () => {
    const { router, client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, null);

    await failQuery(client, unauthorized(), { authRequired: true });

    expect(router.replace).toHaveBeenCalledWith('/login?next=%2Forders%2Fnew%3Ffrom%3Dcart');
  });

  it('세션 캐시를 비워 다음 조회가 로그인 상태를 이어받지 않게 한다', async () => {
    const { client } = setup();
    client.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    await failQuery(client, unauthorized(), { authRequired: true });

    expect(client.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });
});

function expectRouterUnused(router: RouterSpy) {
  expect(router.replace).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
}

describe('만료 처리는 이동 외의 라우팅을 건드리지 않는다', () => {
  it('공개 조회 실패는 어떤 라우팅도 부르지 않는다', async () => {
    const { router, client } = setup();

    await failQuery(client, unauthorized());

    expectRouterUnused(router);
  });
});
