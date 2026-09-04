import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/entities/session/config'

const PROTECTED_PATHS = ['/checkout', '/orders']

const isProtectedPath = (pathname: string): boolean =>
  PROTECTED_PATHS.some(
    (protectedPath) =>
      pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
  )

export function proxy(request: NextRequest): NextResponse {
  if (
    !isProtectedPath(request.nextUrl.pathname) ||
    request.cookies.get(SESSION_COOKIE) !== undefined
  ) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`
  loginUrl.searchParams.set('returnTo', returnTo)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*'],
}
