import { describe, expect, it } from 'vitest';
import { createLoginHref, createLoginSourceHref } from './authNavigation';

describe('createLoginHref', () => {
  it('로그인 주소에 안전한 복귀 경로와 이전 화면을 분리해 인코딩한다', () => {
    expect(createLoginHref('/orders/new', 'cart')).toBe(
      '/login?returnTo=%2Forders%2Fnew&loginSource=cart',
    );
    expect(createLoginHref('/orders')).toBe('/login?returnTo=%2Forders');
  });
});

describe('createLoginSourceHref', () => {
  it('기존 query와 hash를 유지하면서 로그인 출처를 추가한다', () => {
    expect(
      createLoginSourceHref('/orders/new?coupon=welcome#payment', 'cart'),
    ).toBe('/orders/new?coupon=welcome&loginSource=cart#payment');
  });

  it('직접 진입은 URL에 별도 출처를 추가하지 않는다', () => {
    expect(createLoginSourceHref('/orders/new', 'direct')).toBe('/orders/new');
  });
});
