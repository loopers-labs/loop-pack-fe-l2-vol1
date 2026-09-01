import { describe, expect, it } from 'vitest';

import { resolveAuthGuide } from './resolveAuthGuide';

/**
 * 로그인 안내 문구 (단위)
 *
 * 아는 사유에 어떤 문구가 나오는지는 여기서 보지 않는다. 그건 사용자가 화면에서 읽는 것이라
 * LoginPage 통합 테스트가 이미 단언한다 — 여기서 같은 문구를 다시 적으면 문구를 고칠 때
 * 두 파일을 고쳐야 하고, 그때 잡히는 것은 결함이 아니라 한쪽만 고친 상태다.
 *
 * 여기 남기는 것은 문구가 아니라 안전 불변조건 하나다. reason 은 URL 에서 오므로
 * 우리가 붙이지 않은 값도 들어오는데, 그때 없던 사건을 알리지 않는다.
 */
describe('로그인 안내 문구', () => {
  it.each([
    ['사유 없이 직접 들어옴', undefined],
    ['빈 문자열', ''],
    ['앱이 붙이지 않는 값', 'banned'],
    ['대소문자가 다른 값', 'Required'],
  ])('%s (%s) 이면 문구를 만들어내지 않는다', (_label, reason) => {
    expect(resolveAuthGuide(reason)).toBeNull();
  });
});
