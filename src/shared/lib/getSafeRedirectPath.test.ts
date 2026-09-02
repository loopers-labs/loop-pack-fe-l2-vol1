// [AI] getSafeRedirectPath 단위 테스트. 화이트리스트 규칙과 공격 시나리오를 검증한다.
import { describe, it, expect } from 'vitest';
import { getSafeRedirectPath } from './getSafeRedirectPath';

describe('getSafeRedirectPath', () => {
  it('내부 경로는 그대로 복원한다 — 쿼리스트링 포함', () => {
    expect(getSafeRedirectPath('/orders')).toBe('/orders');
    expect(getSafeRedirectPath('/orders?page=2')).toBe('/orders?page=2');
    expect(getSafeRedirectPath('/mypage/settings')).toBe('/mypage/settings');
  });

  it('외부 주소는 기본 경로로 되돌린다 — https, 프로토콜 상대(//), 스킴 인젝션 모두', () => {
    const fallback = '/';

    expect(getSafeRedirectPath('https://evil.com')).toBe(fallback);
    expect(getSafeRedirectPath('http://evil.com')).toBe(fallback);
    expect(getSafeRedirectPath('//evil.com')).toBe(fallback);
    expect(getSafeRedirectPath('javascript:alert(1)')).toBe(fallback);
  });

  it('빈 값과 이상한 형식도 기본 경로로 되돌린다', () => {
    expect(getSafeRedirectPath(null)).toBe('/');
    expect(getSafeRedirectPath(undefined)).toBe('/');
    expect(getSafeRedirectPath('')).toBe('/');
    expect(getSafeRedirectPath('orders')).toBe('/'); // '/'로 시작하지 않는 상대 문자열도 거부
  });
});
