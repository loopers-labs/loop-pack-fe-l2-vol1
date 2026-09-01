import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';

// 쿠키 존재 여부만 확인한다. 서명·만료 검증은 각 페이지·API가 이미
// readSessionToken()으로 하고 있어서, 여기서도 반복하면 검증 로직이
// 두 곳에 중복된다. proxy는 "쿠키 자체가 없는 명백한 미로그인"만
// 1차로 걸러내는 가벼운 문지기 역할만 한다.
export const config = {
  matcher: ['/orders', '/orders/:path*'],
};

export default function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set(
    'redirect',
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.redirect(loginUrl);
}
