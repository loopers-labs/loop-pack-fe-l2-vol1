import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { createLoginHref } from '@/features/auth/lib/authNavigation';
import { getLoginFrom } from '@/shared/lib/loginFrom';

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const returnUrl = request.nextUrl.clone();
  const loginFrom = getLoginFrom(returnUrl.searchParams.get('from'));
  returnUrl.searchParams.delete('from');
  const returnTo = `${returnUrl.pathname}${returnUrl.search}`;
  return NextResponse.redirect(
    new URL(createLoginHref(returnTo, loginFrom), request.url),
  );
}

export const config = {
  matcher: ['/orders/:path*'],
};
