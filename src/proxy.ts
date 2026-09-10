import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { buildLoginUrl } from "@/shared/lib/return-to";

// 보호 경로 가드. 세션 쿠키의 존재만 본다.
// 서명·만료 검증은 비밀키가 필요하고 보호 페이지의 서버 렌더(requireServerSession)와 API 가 어차피 다시
// 검증하므로, 여기서는 "로그인한 적이 없는 요청" 만 걸러 로그인으로 보내고 원래 경로를 next 로 싣는다
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE) && request.cookies.get(SESSION_COOKIE)?.value !== "") {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(new URL(buildLoginUrl(`${pathname}${search}`), request.url));
}

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/mypage/:path*"],
};
