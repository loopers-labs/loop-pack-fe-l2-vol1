import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@app/api/_data/auth-cookies'
import { toLoginPath } from '@/shared/lib/to-login-path'

/*
  여기서는 쿠키 존재만 확인하고, 서명·만료 검증은 API에 남긴다.
  위조·만료 쿠키는 보호 화면의 서버 세션 확인 또는 데이터 요청의 401에서 처리한다.
*/
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl

  return NextResponse.redirect(new URL(toLoginPath(`${pathname}${search}`), request.url))
}

/* matcher는 빌드 시점에 정적으로 읽히므로 보호 경로를 별도 변수로 분리하지 않는다. */
export const config = {
  matcher: [
    '/cart/:path*',
    '/checkout/:path*',
    '/mypage/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
  ],
}
