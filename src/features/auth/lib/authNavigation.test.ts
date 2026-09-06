import { describe, expect, it } from 'vitest';
import { createLoginHref } from './authNavigation';

describe('createLoginHref', () => {
  it('로그인 주소에 안전한 복귀 경로와 이전 화면을 분리해 인코딩한다', () => {
    expect(createLoginHref('/orders/new', 'cart')).toBe(
      '/login?returnTo=%2Forders%2Fnew&from=cart',
    );
    expect(createLoginHref('/orders')).toBe('/login?returnTo=%2Forders');
  });
});
