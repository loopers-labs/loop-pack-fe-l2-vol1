import { NextResponse, type NextRequest } from 'next/server';

import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { buildLoginUrl } from '@/features/auth';

/**
 * 보호 경로 가드. 쿠키 존재가 아니라 서명과 만료까지 검증해 layout과 같은 기준으로 판정한다.
 * Next 16 proxy는 항상 Node 런타임이라 node:crypto를 쓰는 readSessionToken을 그대로 쓴다.
 */
export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (user) return NextResponse.next();

  const { pathname, search } = request.nextUrl;

  return NextResponse.redirect(
    new URL(
      buildLoginUrl(pathname + search, {
        from: pathname.split('/')[1] || 'direct',
      }),
      request.url,
    ),
  );
}

export const config = {
  matcher: ['/orders/:path*'],
};
