import { describe, expect, it } from 'vitest';

import { buildLoginUrl, toSafeNextPath } from './login-url';

const parse = (url: string) => new URL(url, 'http://localhost');

describe('buildLoginUrl', () => {
  it('돌아갈 경로를 next query에 담아 로그인 경로를 만든다', () => {
    const url = parse(
      buildLoginUrl('/orders?status=pending', { from: 'orders' }),
    );

    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/orders?status=pending');
    expect(url.searchParams.get('from')).toBe('orders');
    expect(url.searchParams.get('reason')).toBeNull();
  });

  it('세션 만료는 reason=expired를 함께 전달한다', () => {
    const url = parse(buildLoginUrl('/my', { from: 'my', reason: 'expired' }));

    expect(url.searchParams.get('next')).toBe('/my');
    expect(url.searchParams.get('from')).toBe('my');
    expect(url.searchParams.get('reason')).toBe('expired');
  });
});

describe('toSafeNextPath', () => {
  it('내부 경로는 query까지 그대로 둔다', () => {
    const next = '/orders?status=pending';

    expect(toSafeNextPath(next)).toBe(next);
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '/..//evil.com',
    '//[invalid',
    null,
  ])('안전한 내부 경로가 아닌 값 %s은 홈으로 대체한다', (next) => {
    expect(toSafeNextPath(next)).toBe('/');
  });
});
