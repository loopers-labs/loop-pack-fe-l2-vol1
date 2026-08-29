import { describe, expect, it } from 'vitest';

import { buildLoginUrl, toSafeNextPath } from './login-url';

const parse = (url: string) => new URL(url, 'http://localhost');

describe('buildLoginUrl', () => {
  it('돌아갈 경로를 next query에 담아 로그인 경로를 만든다', () => {
    const url = parse(buildLoginUrl('/orders?status=pending'));

    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/orders?status=pending');
    expect(url.searchParams.get('reason')).toBeNull();
  });

  it('세션 만료는 reason=expired를 함께 전달한다', () => {
    const url = parse(buildLoginUrl('/my', 'expired'));

    expect(url.searchParams.get('next')).toBe('/my');
    expect(url.searchParams.get('reason')).toBe('expired');
  });
});

describe('toSafeNextPath', () => {
  it.each(['/orders?status=pending', '/my', '/'])(
    '내부 경로 %s는 그대로 둔다',
    (next) => {
      expect(toSafeNextPath(next)).toBe(next);
    },
  );

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'evil.com',
    '',
    null,
    undefined,
  ])('외부로 이동할 수 있는 값 %s은 홈으로 대체한다', (next) => {
    expect(toSafeNextPath(next)).toBe('/');
  });
});
