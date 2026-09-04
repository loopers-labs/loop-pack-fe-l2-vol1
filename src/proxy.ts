import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { safeNextPath } from "@/shared/lib/safeNextPath";

// Next 16에서 middleware가 proxy로 바뀌었다(PROXY_FILENAME = 'proxy').
//
// ── 보호 경로의 경계 ────────────────────────────────────────────────────────
// 주문서와 주문 내역만 막는다. 장바구니·위시리스트는 헤더의 개수 표시뿐이고
// 화면이 없다. 로그인 없이도 담을 수 있어야 한다고 봤다 — 담기 위해 로그인을
// 요구하면 이탈이 나고, 서버에 저장되는 것도 아니라 보호할 자산이 없다.
// 결제로 넘어가는 경계, 즉 서버에 주문이 남는 자리에서 처음 막는다.
export const PROTECTED_PREFIXES = ["/checkout", "/orders"];

// ── 여기서 서명까지 검증하지 않는다 ──────────────────────────────────────────
// proxy는 Edge에서 돌고 auth.ts는 node:crypto를 쓴다(그래서 스타터가 상수만
// auth-cookies.ts로 갈라 두었다). 서명 검증을 여기로 끌어오면 crypto가 Edge
// 번들에 들어가 build는 통과하고 실행에서 500이 난다.
//
// 대신 역할을 나눈다. proxy는 **쿠키가 없는 사람**을 값싸게 되돌려보내고(대다수),
// 위조·만료된 쿠키는 페이지와 API가 실제로 검증한다. 위조 쿠키를 들고 들어와도
// /api/auth/me가 401을 주므로 화면은 로그인 상태가 되지 않는다.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  // 원래 가려던 경로를 그대로 실어 보낸다. 쿼리까지 담아야 `?productId=p3`이
  // 살아남는다 — 주문서는 무엇을 살지를 URL로 받기 때문이다.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", safeNextPath(`${pathname}${search}`));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 정적 자산과 API는 지나가게 둔다. API는 자기 401을 스스로 돌려줘야 한다 —
  // 여기서 리다이렉트하면 fetch가 HTML을 받고 파싱에서 죽는다.
  matcher: ["/checkout/:path*", "/orders/:path*"],
};
