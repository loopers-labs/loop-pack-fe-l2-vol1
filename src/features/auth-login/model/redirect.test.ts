import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './redirect';

describe('getSafeRedirectPath', () => {
  it.each([
    ['https://evil.com', '스킴이 붙은 절대 주소'],
    ['//evil.com', '프로토콜 상대 주소'],
    [
      '/\\evil.com',
      '백슬래시 — new URL()이 /를 붙인 것처럼 풀어 evil.com으로 나감',
    ],
  ])('%s(%s)는 외부로 못 나가고 기본값(/)으로 대체된다', (raw) => {
    expect(getSafeRedirectPath(raw)).toBe('/');
  });

  it.each([
    [null, '/'],
    ['', '/'],
    ['/orders/new', '/orders/new'],
    ['/orders?tab=history', '/orders?tab=history'],
  ])('%s는 그대로(또는 기본값으로) 허용된다', (raw, expected) => {
    expect(getSafeRedirectPath(raw)).toBe(expected);
  });
});
