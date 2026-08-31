import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { proxy } from './proxy';

describe('orders proxy', () => {
  it('세션 쿠키가 없으면 query를 포함한 주문 경로를 로그인 복귀 경로로 보낸다', () => {
    const response = proxy(
      new NextRequest('http://localhost/orders/new?from=cart'),
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost/login?returnTo=%2Forders%2Fnew%3Ffrom%3Dcart',
    );
  });

  it('세션 쿠키가 있으면 보호 경로 요청을 계속 진행한다', () => {
    const request = new NextRequest('http://localhost/orders');
    request.cookies.set(SESSION_COOKIE, 'signed-session');

    const response = proxy(request);

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });
});
