import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies'
import { loginPathFor } from '@/entities/session/model/loginRedirect'
import { isProtectedPath } from '@/entities/session/model/protectedPaths'

// 보호 경로의 1차 확인이다. 세션 쿠키가 없는 요청을 화면이 그려지기 전에 로그인으로 보낸다.
//
// 여기서 서명과 만료까지 검증하지 않는 이유는 두 가지다. proxy는 해당하는 모든 요청마다
// 실행되므로 값싼 확인만 두는 편이 낫고, 실제 판정을 여러 곳에 두면 규칙이 갈린다.
// 검증은 세션을 읽는 지점 한 곳(app/_session/currentUser.ts의 requireSessionUser)에 모은다.
// 위조하거나 만료된 쿠키는 이 확인을 통과하지만 실제 검증 단계에서 로그인 화면으로 이동한다.
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next()
  }

  // 원래 요청한 주소와 쿼리를 함께 전달한다. 경로만 전달하면 목록의 필터나 페이지가
  // 로그인 뒤에 사라져, 사용자가 조건을 다시 세워야 한다.
  const redirectUrl = new URL(
    loginPathFor(`${pathname}${search}`),
    request.nextUrl,
  )
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  // 정적 자산과 API에는 적용하지 않는다. API는 자체 응답으로 401을 반환해야 하고,
  // 여기서 302 로 바꾸면 fetch 호출자가 로그인 화면 HTML 을 JSON 으로 읽는다.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}
