import { NextResponse, type NextRequest } from 'next/server';
import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';

// 보호 경로 가드 (RFC D2·D3).
//
// 쿠키의 존재가 아니라 **서명과 만료까지** 검증한다. 스타터 주석은 proxy가 Edge에서 돈다고 안내하지만,
// Next 16.2.10의 proxy는 Node 런타임에서 실행돼 `node:crypto`를 쓰는 `auth.ts`를 그대로 가져올 수 있다.
// 빌드 통과와 실행을 둘 다 확인했다: 위조 쿠키(`session=fake.sig`)는 307로 로그인에 보내고,
// 정상 로그인 쿠키는 200으로 통과하며, 서버 로그에 crypto·Edge 관련 오류가 없다.
//
// 존재만 확인하면 위조·만료 쿠키가 보호 화면까지 들어와 401 경계에서야 튕긴다. 같은 판정 함수를
// proxy와 `(commerce)` 레이아웃이 함께 쓰면 "로그인했는가"의 기준이 한 곳으로 모인다.
//
// 복원 경로는 `next`에 원래 pathname+search를 그대로 싣는다. 검증은 받는 쪽(/login page.tsx의
// resolveNextPath)이 한다 — 값을 만드는 쪽이 아니라 쓰는 쪽에서 막아야 URL을 직접 친 경우도 막힌다.
export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (user !== null) {
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
