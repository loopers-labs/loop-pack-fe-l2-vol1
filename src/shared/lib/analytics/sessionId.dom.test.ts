import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSessionId } from './sessionId';

/**
 * 세션 식별자 (단위)
 *
 * sessionStorage 를 쓰므로 jsdom 이 필요하다. 저장소는 실물을 쓰고 비우기만 한다 —
 * 갈아끼우면 "탭 하나가 세션 하나"라는 결정이 저장소 동작으로 지켜지는지를 못 본다.
 */
describe('세션 식별자', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('같은 탭에서는 몇 번을 물어도 같은 값을 준다', () => {
    expect(getSessionId()).toBe(getSessionId());
  });

  // 탭을 닫으면 sessionStorage 가 비는 것이 곧 새 세션이다
  it('저장소가 비면 새 세션으로 본다', () => {
    const first = getSessionId();

    window.sessionStorage.clear();

    expect(getSessionId()).not.toBe(first);
  });

  // 프라이빗 모드처럼 저장소를 못 쓰는 환경에서도 이벤트를 버리지 않는다
  it('저장소를 쓸 수 없으면 세션이 쪼개질지언정 값은 준다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('저장소 접근이 차단되었습니다.');
    });

    expect(getSessionId()).toEqual(expect.any(String));
  });
});
