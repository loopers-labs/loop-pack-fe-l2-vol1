import { NextResponse, type NextRequest } from 'next/server';
import { readSessionToken } from './app/api/_data/auth';
import { SESSION_COOKIE } from './app/api/_data/auth-cookies';

export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (user !== null) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.nextUrl);
  loginUrl.searchParams.set('next', request.nextUrl.href);

  const redirect = NextResponse.redirect(loginUrl);
  // 인증 상태에 따라 갈리는 응답이라 캐시에 남으면 안 된다. 히스토리 앞/뒤 이동은 신선도를
  // 무시하고 캐시를 재사용하므로(force-cache), 남겨두면 로그인한 뒤에도 이 리다이렉트가 되살아난다.
  redirect.headers.set('cache-control', 'no-store');
  return redirect;
}

export const config = {
  matcher: ['/orders/:path*', '/mypage']
};
