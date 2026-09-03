import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/shared/config/session';
import { buildLoginPath } from '@/shared/lib/safeRedirectPath';

/**
 * 보호 경로 가드.
 *
 * 여기서는 세션 쿠키가 있는지만 본다. 서명과 만료를 실제로 검증하려면
 * `readSessionToken()`이 필요한데 그 함수는 `node:crypto`를 쓰고 proxy는 Edge에서 돌기
 * 때문이다. 합쳐 두면 `next build`는 경고만 내고 통과한 뒤 실행에서 500이 난다.
 *
 * 그래서 proxy는 "쿠키조차 없는 요청"을 걸러내는 빠른 게이트이고, 위조되거나 만료된
 * 쿠키는 통과시킨다. 그 뒤 서버가 세션을 해석하면서 다시 걸러 로그인으로 되돌린다.
 * 두 겹이 필요한 게 아니라, 각 겹이 볼 수 있는 것이 다르다.
 *
 * 보호 범위는 주문서와 주문 내역이다. 담기는 구매 의사 표시 전 단계라 인증을 요구하면
 * 이탈만 만들고, 결제 책임이 시작되는 주문서부터 인증을 요구한다.
 */

export default function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  // 쿠키가 없다는 건 로그인한 적이 없다는 뜻이라 만료가 아니다
  return NextResponse.redirect(
    new URL(buildLoginPath(toRedirectTarget(request), false), request.url),
  );
}

/**
 * 되돌아갈 대상은 pathname과 search까지만 담는다.
 * origin을 함께 넣으면 그 값이 외부 주소로 바뀌었는지 로그인 화면이 다시 검사해야 한다.
 */
function toRedirectTarget(request: NextRequest): string {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

export const config = {
  matcher: ['/orders/:path*'],
};
