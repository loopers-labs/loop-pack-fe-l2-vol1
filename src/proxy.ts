import { type NextRequest, NextResponse } from 'next/server'

import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies'
import { AuthRedirect } from '@/entities/auth/model/AuthRedirect'

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  if (sessionToken !== undefined && sessionToken.length > 0) {
    return NextResponse.next()
  }

  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  return NextResponse.redirect(
    new URL(AuthRedirect.toLoginPath(requestedPath), request.url),
  )
}

export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*'],
}
