import { describe, expect, it } from 'vitest';

import { resolveAuthGuide } from './authGuide';

/**
 * 로그인 안내 문구 (단위)
 *
 * reason 은 URL 쿼리에서 오므로 앱이 붙이지 않은 값도 들어온다. 여기서 지키는 것은
 * "아는 사유에는 그 문구를, 모르는 값에는 아무것도" 다.
 */
describe('로그인 안내 문구', () => {
  it('보호 경로에 미로그인으로 들어와 튕겨 왔다면 로그인이 필요하다고 알린다', () => {
    expect(resolveAuthGuide('required')).toBe('로그인이 필요한 페이지입니다.');
  });

  it('세션이 만료돼 튕겨 왔다면 만료됐다고 알린다', () => {
    expect(resolveAuthGuide('expired')).toBe('세션이 만료되었습니다. 다시 로그인해주세요.');
  });

  // 사유 없이 직접 들어온 사람에게 없던 사건을 알리지 않는다
  it.each([
    ['사유 없이 직접 들어옴', undefined],
    ['빈 문자열', ''],
    ['앱이 붙이지 않는 값', 'banned'],
    ['대소문자가 다른 값', 'Required'],
  ])('%s (%s) 이면 문구를 만들어내지 않는다', (_label, reason) => {
    expect(resolveAuthGuide(reason)).toBeNull();
  });
});
