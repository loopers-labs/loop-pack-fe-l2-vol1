import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { proxy } from './proxy';

describe('orders proxy', () => {
  it('세션 쿠키가 없으면 내부 링크의 이전 화면 표식을 로그인 주소로 옮긴다', () => {
    const response = proxy(
      new NextRequest('http://localhost/orders/new?from=cart'),
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost/login?returnTo=%2Forders%2Fnew&from=cart',
    );
  });

  it('직접 진입하거나 허용하지 않은 표식이면 이전 화면을 direct로 둔다', () => {
    const directResponse = proxy(
      new NextRequest('http://localhost/orders/new'),
    );
    const invalidResponse = proxy(
      new NextRequest('http://localhost/orders?from=external'),
    );

    expect(directResponse.headers.get('location')).toBe(
      'http://localhost/login?returnTo=%2Forders%2Fnew',
    );
    expect(invalidResponse.headers.get('location')).toBe(
      'http://localhost/login?returnTo=%2Forders',
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
