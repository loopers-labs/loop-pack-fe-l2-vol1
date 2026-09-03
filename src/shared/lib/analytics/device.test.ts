import { describe, expect, it } from 'vitest';

import { toDevice } from './device';

/**
 * 기기 판정 (단위)
 *
 * 경계값을 직접 짚는다. 768·1024 는 두 구간이 만나는 지점이라 부등호가 뒤집혀도
 * 중간값만 보는 테스트로는 드러나지 않는다.
 */
describe('기기 판정', () => {
  it.each([
    ['좁은 화면', 320, 'mobile'],
    ['모바일 경계 직전', 767, 'mobile'],
    ['태블릿 경계', 768, 'tablet'],
    ['태블릿 경계 직전', 1023, 'tablet'],
    ['데스크톱 경계', 1024, 'desktop'],
    ['넓은 화면', 1920, 'desktop'],
  ])('%s (%dpx) 은 %s 로 본다', (_label, width, expected) => {
    expect(toDevice(width)).toBe(expected);
  });
});
