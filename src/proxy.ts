import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { AUTH_REASON_PARAM, LOGIN_PATH, RETURN_TO_PARAM } from '@/shared/config/routes';
import { isProtectedPath } from '@/shared/lib/isProtectedPath';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 보호 경로 가드.
 *
 * 함수 이름은 반드시 `proxy` 다. Next 16 이 middleware 를 proxy 로 바꾸면서 이 이름으로
 * 함수를 찾는다. `middleware` 로 두면 build 가 "Proxy is missing expected function export name"
 * 으로 막히고, 그 경고를 무시하면 파일이 무시된 채 보호 경로가 그냥 열린다.
 * 이 테스트는 함수를 직접 import 해 부르므로 이름이 틀려도 초록으로 통과한다 —
 * 실제 요청 경계에서 도는지는 pnpm start 와 E2E 로만 확인된다.
 *
 * 여기서 하는 판정은 "세션 쿠키가 있는가" 하나뿐이다. 서명 검증은 하지 않는다.
 * 서명까지 보려면 node:crypto 가 Edge 번들에 끌려 들어오고, 위조 쿠키는 어차피
 * 페이지·API 가 /api/auth/me 로 401 을 받아 걸러낸다. 여기서 막고 싶은 것은
 * "아예 로그인하지 않은 사람이 보호 화면의 HTML 을 받는 것"이다.
 *
 * 만료는 여기서 판정하지 않는다. /api/auth/me 가 미로그인과 만료를 같은 401 로 돌려주므로
 * 쿠키만 보는 이 레이어는 둘을 가를 수 없다. 만료는 서버 401 을 실제로 받아본
 * 클라이언트 인터셉터(shared/api/apiClient.ts)가 reason=expired 로 처리한다.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = '';
  // 쿼리까지 복원한다. /products?page=2 에서 튕겨 온 사람을 목록 1페이지로 돌려보내지 않는다.
  loginUrl.searchParams.set(RETURN_TO_PARAM, `${pathname}${request.nextUrl.search}`);
  loginUrl.searchParams.set(AUTH_REASON_PARAM, 'required');

  return NextResponse.redirect(loginUrl);
}

/**
 * matcher 는 정적 문자열 배열이어야 한다. Next 가 이 값을 컴파일 타임에 파싱하므로
 * PROTECTED_ROUTES 에서 flatMap 으로 파생시키면 build 가 막힌다.
 *
 * 그래서 보호 경로 목록이 이 파일에 두 번째로 적힌다. 손으로 맞춰야 하는 유일한 자리라,
 * 실제로 어긋나지 않는지는 proxy.test.ts 가 PROTECTED_ROUTES 와 대조해 지킨다.
 */
export const config = {
  matcher: ['/order', '/order/:path*', '/orders', '/orders/:path*', '/mypage', '/mypage/:path*'],
};
