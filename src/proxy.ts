import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { REDIRECT_PARAM } from "@/shared/lib/safeRedirect";

const LOGIN_PATH = "/login";

// 보호 경로 접근 가드(라우팅 레벨).
// 로그인 화면 자체의 "로그인 상태면 진입 차단"은 여기서 하지 않는다 — proxy 는 쿠키 서명만 보는데,
// 만료(scenario=expired)는 쿠키를 유효하게 둔 채 API 만 401 로 만들어 판정이 어긋난다. 그 차단은
// 앱 세션(/api/auth/me)을 아는 로그인 화면(LoginForm)이 맡는다.
export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (user !== null) {
    return NextResponse.next();
  }

  // 무효/없는 세션 → 로그인으로. 원래 가려던 경로를 redirectUrl 로 실어 로그인 후 복원한다.
  // 이 값은 서버가 만든 자기 경로라 안전하다 — 외부 주소로 튕기는 오픈 리다이렉트는 소비처(LoginForm)의
  // safeRedirect 가 막는다.
  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set(
    REDIRECT_PARAM,
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/orders", "/orders/new", "/mypage/:path*"],
};
