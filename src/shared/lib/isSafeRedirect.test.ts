import { describe, expect, it } from 'vitest';

import { isSafeRedirect } from './isSafeRedirect';

/**
 * 복원 경로 검증 하네스
 *
 * 이 함수 하나가 오픈 리다이렉트를 막는 지점이라 우회 벡터를 여기서 전수로 훑는다.
 * 호출부(로그인 화면·401 인터셉터)의 통합 테스트는 "거부된 값이 / 로 이어진다"는
 * 연결만 한 건씩 확인하고 벡터를 반복하지 않는다.
 *
 * 형태 검사만 한다는 결정의 결과도 함께 남긴다 — 보호 경로가 아니어도, 존재하지 않는
 * 경로여도 형태가 상대경로면 통과한다. 화이트리스트를 쓰지 않기로 한 판단이 그것이다.
 */
describe('복원 경로 검증', () => {
  describe('사이트 안으로 돌아가는 상대경로는 통과시킨다', () => {
    it.each(['/', '/products', '/products/p1', '/order', '/orders?page=2', '/mypage#profile'])(
      '%s 를 허용한다',
      (path) => {
        expect(isSafeRedirect(path)).toBe(true);
      },
    );

    // 화이트리스트가 아니라 형태 검사다. 보호 경로 목록과 무관하게 형태만 본다
    it('보호 경로 목록에 없는 경로도 형태가 맞으면 허용한다', () => {
      expect(isSafeRedirect('/이런/경로는/없지만/형태는/맞다')).toBe(true);
    });
  });

  describe('사이트 밖으로 나가는 값은 거부한다', () => {
    it.each([
      ['프로토콜 상대 URL', '//evil.com'],
      ['역슬래시로 위장한 프로토콜 상대 URL', '/\\evil.com'],
      ['슬래시만 두 개', '//'],
      ['절대 URL', 'https://evil.com'],
      ['같은 호스트로 위장한 절대 URL', 'https://evil.com/products'],
      ['javascript 스킴', 'javascript:void(0)'],
      ['data 스킴', 'data:text/html,<h1>evil</h1>'],
    ])('%s (%s) 을 거부한다', (_label, path) => {
      expect(isSafeRedirect(path)).toBe(false);
    });
  });

  describe('경로로 해석할 수 없는 값은 거부한다', () => {
    it.each([
      ['빈 문자열', ''],
      ['앞 슬래시가 없는 값', 'products'],
    ])('%s (%s) 을 거부한다', (_label, path) => {
      expect(isSafeRedirect(path)).toBe(false);
    });
  });
});
