import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";

// 보호 경로 인그레스 게이트. 세션 쿠키 존재만 확인하고, 없으면 로그인으로 보낸다.
// 서명·TTL 검증은 여기(edge)서 하지 않는다 — node:crypto가 edge 번들에 없어, 상수만 담은
// auth-cookies에서 쿠키 이름만 가져온다(auth.ts를 import하면 crypto가 끌려와 런타임 500).
// 존재를 통과한 요청의 실검증은 Node(RSC·라우트 핸들러)가 맡는다.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  // 원래 가려던 경로를 복원용으로 싣는다. 이 값은 로그인 페이지가 safeRedirect로 다시 검증해 소비한다.
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

// 보호 경로만 매칭한다 — 주문서·주문내역. 공개 경로(홈·상품·장바구니·로그인)는 여기 없다.
export const config = {
  matcher: ["/order-form", "/orders"],
};
