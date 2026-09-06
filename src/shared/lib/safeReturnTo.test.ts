import { describe, expect, it } from 'vitest';
import { getSafeReturnTo } from './safeReturnTo';

describe('getSafeReturnTo', () => {
  it('내부 경로와 query string을 유지한다', () => {
    expect(getSafeReturnTo('/orders/new?from=cart')).toBe(
      '/orders/new?from=cart',
    );
  });

  it.each([
    'https://example.com/orders',
    '//example.com/orders',
    '/\\example.com/orders',
    'orders/new',
  ])('외부 이동 가능성이 있는 %s를 기본 경로로 바꾼다', (value) => {
    expect(getSafeReturnTo(value)).toBe('/');
  });
});
