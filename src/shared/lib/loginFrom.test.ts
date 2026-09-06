import { describe, expect, it } from 'vitest';
import { getLoginFrom, getLoginFromPathname } from './loginFrom';

describe('loginFrom', () => {
  it('외부 입력을 허용된 로그인 출처로 제한한다', () => {
    expect(getLoginFrom('cart')).toBe('cart');
    expect(getLoginFrom('orders')).toBe('orders');
    expect(getLoginFrom('direct')).toBe('direct');
    expect(getLoginFrom('unknown')).toBe('direct');
    expect(getLoginFrom(null)).toBe('direct');
  });

  it('이전 화면 경로를 로그인 출처로 변환한다', () => {
    expect(getLoginFromPathname('/cart')).toBe('cart');
    expect(getLoginFromPathname('/orders')).toBe('orders');
    expect(getLoginFromPathname('/orders/new')).toBe('orders');
    expect(getLoginFromPathname('/products')).toBe('direct');
  });
});
