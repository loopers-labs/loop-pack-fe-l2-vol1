import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { REDIRECT_PARAM } from "@/shared/lib/safeRedirect";

// 보호 경로 접근 가드(라우팅 레벨).
export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (user !== null) {
    return NextResponse.next();
  }

  // 무효/없는 세션 → 로그인으로. 원래 가려던 경로를 redirectUrl 로 실어 로그인 후 복원한다.
  // 이 값은 서버가 만든 자기 경로라 안전하다 — 외부 주소로 튕기는 오픈 리다이렉트는 소비처(LoginForm)의
  // safeRedirect 가 막는다.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    REDIRECT_PARAM,
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/orders", "/orders/new", "/mypage/:path*"],
};
