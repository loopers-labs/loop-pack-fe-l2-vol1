import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { createLoginHref } from '@/features/auth/lib/authNavigation';

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(new URL(createLoginHref(returnTo), request.url));
}

export const config = {
  matcher: ['/orders/:path*'],
};
