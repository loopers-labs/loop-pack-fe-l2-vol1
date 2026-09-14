import { describe, expect, it } from 'vitest';
import {
  getLoginEntrySource,
  getLoginEntrySourceFromPathname,
} from './loginEntrySource';

describe('loginEntrySource', () => {
  it('외부 입력을 허용된 로그인 출처로 제한한다', () => {
    expect(getLoginEntrySource('cart')).toBe('cart');
    expect(getLoginEntrySource('orders')).toBe('orders');
    expect(getLoginEntrySource('direct')).toBe('direct');
    expect(getLoginEntrySource('unknown')).toBe('direct');
    expect(getLoginEntrySource(null)).toBe('direct');
  });

  it('이전 화면 경로를 로그인 출처로 변환한다', () => {
    expect(getLoginEntrySourceFromPathname('/cart')).toBe('cart');
    expect(getLoginEntrySourceFromPathname('/orders')).toBe('orders');
    expect(getLoginEntrySourceFromPathname('/orders/new')).toBe('orders');
    expect(getLoginEntrySourceFromPathname('/products')).toBe('direct');
  });
});
