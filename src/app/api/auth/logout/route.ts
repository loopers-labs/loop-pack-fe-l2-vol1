import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  // 응답 없음(null).
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: request.nextUrl.protocol === 'https:',
  });

  return response;
};
