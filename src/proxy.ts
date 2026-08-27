import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { REDIRECT_PARAM, safeRedirect } from "@/shared/lib/safeRedirect";

const LOGIN_PATH = "/login";

// 라우팅 레벨 접근 가드(JS 실행 전 서버 단에서 처리 — 화면 깜빡임 없음).
// - 보호 경로: 미로그인이면 로그인으로 보내고 원래 경로를 redirectUrl 로 실어 복원한다.
// - 로그인 화면: 이미 로그인한 사용자는 볼 이유가 없으니 되돌려보낸다.
export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthenticated = user !== null;

  if (request.nextUrl.pathname === LOGIN_PATH) {
    if (!isAuthenticated) {
      return NextResponse.next();
    }
    // 원래 가려던 곳(있으면)으로, 없으면 홈으로. redirectUrl 은 외부·트릭 경로일 수 있어 safeRedirect 로 접는다.
    const target = safeRedirect(
      request.nextUrl.searchParams.get(REDIRECT_PARAM),
    );

    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isAuthenticated) {
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
  matcher: ["/login", "/orders", "/orders/new", "/mypage/:path*"],
};
