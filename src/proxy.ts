import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import {
  createLoginHref,
  LOGIN_SOURCE_SEARCH_PARAM,
} from '@/features/auth/lib/authNavigation';
import { getLoginEntrySource } from '@/shared/lib/loginEntrySource';

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const returnUrl = request.nextUrl.clone();
  const loginSource = getLoginEntrySource(
    returnUrl.searchParams.get(LOGIN_SOURCE_SEARCH_PARAM),
  );
  returnUrl.searchParams.delete(LOGIN_SOURCE_SEARCH_PARAM);
  const returnTo = `${returnUrl.pathname}${returnUrl.search}`;
  return NextResponse.redirect(
    new URL(createLoginHref(returnTo, loginSource), request.url),
  );
}

export const config = {
  matcher: ['/orders/:path*'],
};
