import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@app/api/_data/auth-cookies'
import { toLoginPath } from '@/shared/lib/to-login-path'

// 서버 미인증을 받는 한 곳. 클라이언트 쿼리의 401은 _app의 QueryCache가 받는다
// (docs/week-09/decisions.md 4번). 서버와 클라이언트는 다른 경로라 합쳐지지 않는다.
//
// 쿠키의 존재만 본다. 서명·만료 검증은 API 한 곳에 남긴다 — 가드가 토큰을 해석하기 시작하면
// mock 서버 내부 모듈(app/api/_data/auth.ts)에 묶여, 실제 백엔드가 분리되면 못 쓰는 코드가 된다.
// 세션을 "해석하지 않고 전달만 한다"는 6번의 결정과 같은 결이다.
//
// 위조·만료 쿠키는 여기를 통과한다. 대신 그 화면의 데이터 요청이 401을 받고
// _app의 핸들러가 로그인으로 보낸다. 한 번 더 튕기는 대신 가드가 mock에 묶이지 않는다.
//
// Next 16의 proxy는 Node 런타임 고정이라 node:crypto도 부를 수 있다(Edge는 middleware만).
// 그래서 이건 런타임 제약이 아니라 의존 방향을 보고 고른 선택이다.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl

  return NextResponse.redirect(new URL(toLoginPath(`${pathname}${search}`), request.url))
}

// 보호 경로 목록은 여기 하나다. matcher가 곧 목록이라 따로 배열을 두지 않는다.
// 기준은 "사용자 고유 데이터를 보여주는 화면 전부"이고, 지금은 다섯이다(decisions.md 2번).
// matcher는 빌드 시점에 정적으로 읽히므로 변수나 계산식을 쓰지 않는다.
export const config = {
  matcher: [
    '/cart/:path*',
    '/checkout/:path*',
    '/mypage/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
  ],
}
