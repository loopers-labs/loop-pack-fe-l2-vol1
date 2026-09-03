import { cache } from 'react';
import { cookies } from 'next/headers';
import { isAuthScenario, readSessionToken } from '@/app/api/_data/auth';
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/shared/config/session';
import { resolveSessionStatus, type ServerSession } from '@/entities/session/model/session';

/**
 * 서버에서 세션을 읽는다. 초기 HTML에 로그인 상태를 담기 위한 단 하나의 경로다.
 *
 * app 레이어에 두는 이유 — `cookies()`와 `readSessionToken()`이 둘 다 서버 전용이고,
 * 후자는 `node:crypto`를 쓴다. entities로 내리면 FSD 규칙(entities는 app을 참조할 수 없다)을
 * 어기면서 동시에 crypto가 하위 레이어로 새는 경로가 생긴다.
 *
 * 이 함수를 부르는 순간 해당 라우트는 요청 시 렌더링으로 바뀐다. 그래서 세션이 필요한
 * 페이지에서만 부르고 루트 layout에서는 부르지 않는다 — 루트에서 부르면 지금 정적으로
 * 남아 있는 /examples, /performance-lab/inp 까지 동적으로 바뀐다(빌드 출력으로 확인함).
 *
 * `cache()`로 감싸 요청당 한 번만 계산한다. /products 요청 하나에서 loading.tsx와 page.tsx가
 * 각각 부르는데, `cookies()`는 Next가 요청 단위로 메모이즈하지만 `readSessionToken()`의
 * 서명 계산은 부를 때마다 다시 돈다. 같은 요청 안에서는 같은 쿠키를 보므로 결과도 같다.
 * `getQueryClient`가 쓰는 방식과 같다.
 */
export const readServerSession = cache(async (): Promise<ServerSession> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const hasSessionCookie = token !== undefined;

  if (isExpiredScenario(cookieStore.get(SCENARIO_COOKIE)?.value)) {
    return { status: 'expired', user: null };
  }

  const user = readSessionToken(token);
  return { status: resolveSessionStatus(hasSessionCookie, user), user };
});

/**
 * 시나리오 노브를 여기서도 존중한다.
 *
 * 노브는 `me`·`orders`에 대해 "세션 쿠키가 유효해도 항상 401"을 뜻한다. 이 함수가 서버에서
 * 하는 일이 `me`와 같으므로, 여기서 무시하면 초기 HTML은 로그인됐다고 그려 놓고 곧이어
 * 클라이언트 재조회가 401을 받아 화면이 뒤집힌다. 만료를 재현하는 자리에서 깜빡임을
 * 만들지 않으려면 두 경로가 같은 답을 내야 한다.
 */
function isExpiredScenario(value: string | undefined): boolean {
  return value !== undefined && isAuthScenario(value) && value === 'expired';
}
