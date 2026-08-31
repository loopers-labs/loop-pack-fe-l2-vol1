import { describe, expect, it } from 'vitest';
import { createLoginHref } from './authNavigation';

describe('createLoginHref', () => {
  it('로그인 주소에 안전한 복귀 경로를 인코딩한다', () => {
    expect(createLoginHref('/orders/new?from=cart')).toBe(
      '/login?returnTo=%2Forders%2Fnew%3Ffrom%3Dcart',
    );
  });
});
