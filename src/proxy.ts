import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';

// [AI] 보호 경로 가드 (week-09 1-3). 검증 수위는 "존재만 확인"이다 (RFC 쿠키 검증 수위 결정):
// proxy는 Edge 런타임이라 node:crypto 기반 검증을 못 하고, 실제 서명·만료 검증은
// 각 API(readSessionToken)와 보호 페이지의 데이터 호출이 담당한다 (다층 방어).
//
// matcher는 보호 "페이지"와 /login을 가리킨다 — API는 자기 검증이 있고, 페이지 진입만 문지기가 막는다.
export default function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // 로그인 폼: 로그인한 사람에게는 보여줄 정보가 없으므로 홈으로 되돌린다.
  // 미로그인 방문자는 그대로 통과 — 이 화면의 주인공이다. (여기서 리다이렉트하면
  // /login → /login?redirectTo=/login 무한 루프가 되므로 반드시 분리한다.)
  if (pathname === '/login') {
    if (!session) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();

    // 변경 전(예시): https://example.com/login?redirectTo=/orders
    // 변경 후: https://example.com/
    url.pathname = '/'; // login 삭제
    url.search = ''; // login 하위 쿼리 파라미터 삭제
    return NextResponse.redirect(url);
  }

  // 보호 경로에 쿠키 없이 진입 → 로그인으로 돌려보내며 원래 경로를 실어 보낸다 (RFC redirectTo).
  // url.searchParams.set이 값을 인코딩하므로 /orders?page=2 같은 쿼리도 안전하게 실린다.
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 해당 경로에서만 미들웨어가 개입한다.
  matcher: ['/checkout/:path*', '/orders/:path*', '/mypage/:path*', '/login'],
};
