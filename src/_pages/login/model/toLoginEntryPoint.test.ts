import { describe, expect, it } from 'vitest';

import { toLoginEntryPoint } from './toLoginEntryPoint';

/**
 * 로그인 진입 경로 (단위)
 *
 * returnTo 는 URL 에서 오므로 우리가 붙이지 않은 값도 들어온다. 여기서 지키는 것은
 * "집계할 수 있는 값만 내보낸다" 다 — 임의 경로를 그대로 실으면 3단계에서 셀 수 없다.
 */
describe('로그인 진입 경로', () => {
  it.each([
    ['주문서에서 튕겨 옴', '/order', 'order'],
    ['주문 내역에서 튕겨 옴', '/orders', 'orders'],
    ['마이페이지에서 튕겨 옴', '/mypage', 'mypage'],
    ['보호 경로의 하위에서 튕겨 옴', '/orders/o1', 'orders'],
    ['쿼리가 붙은 보호 경로', '/mypage?tab=profile', 'mypage'],
  ])('%s (%s) 은 %s 로 본다', (_label, returnTo, expected) => {
    expect(toLoginEntryPoint(returnTo)).toBe(expected);
  });

  it.each([
    ['돌아갈 곳이 없음', undefined],
    ['보호 목록에 없는 경로', '/products'],
    ['이름만 겹치는 경로', '/ordersomething'],
    ['외부 주소', '//evil.com'],
  ])('%s (%s) 은 direct 로 본다', (_label, returnTo) => {
    expect(toLoginEntryPoint(returnTo)).toBe('direct');
  });
});
