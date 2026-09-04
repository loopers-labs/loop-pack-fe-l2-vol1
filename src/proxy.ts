import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';

// 보호 경로 가드 (RFC D2·D3).
//
// Edge 런타임이라 세션 서명을 검증하지 않는다 — `auth.ts`(node:crypto)를 여기서 import하면
// 빌드는 통과하고 실행에서 500이 난다. 쿠키 **존재**만 본다. 그래서 이 가드가 막는 것은
// "미로그인"이고, "쿠키는 있는데 만료된" 요청은 통과시켜 페이지·API의 401 → D5 경계가 맡는다.
//
// 복원 경로는 `next`에 원래 pathname+search를 그대로 싣는다. 검증은 받는 쪽(/login page.tsx의
// resolveNextPath)이 한다 — 값을 만드는 쪽이 아니라 쓰는 쪽에서 막아야 URL을 직접 친 경우도 막힌다.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

// 보호 경계 = 주문서 · 주문 내역 (RFC D3). 장바구니·위시리스트는 익명 로컬 상태라 보호하지 않는다.
export const config = {
  matcher: ['/checkout', '/checkout/:path*', '/orders', '/orders/:path*'],
};
