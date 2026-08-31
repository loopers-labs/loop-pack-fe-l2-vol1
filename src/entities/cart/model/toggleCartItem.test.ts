import { beforeEach, describe, expect, it } from 'vitest';

import { toggleCartItem } from './toggleCartItem';

/**
 * 검증 항목 1 — 장바구니 개수 파생 (단위)
 *
 * 사용자에게 장바구니는 "내가 담아 둔 상품들"이다. 몇 개인지와 이 상품이 담긴 것인지,
 * 둘 다 따로 저장하지 않고 목록에서 파생한다. 그래서 단언 대상은 배열의 모양이 아니라
 * **담긴 상품 수**와 **담겼는지 여부**다.
 *
 * 어디에 몇 개로 표시되는지(헤더·배지)는 이 테스트가 알 바가 아니다. 표시 위치가 바뀌어도
 * 파생 규칙은 그대로여야 하고, 화면과의 배선은 항목 12(통합)가 본다.
 * 이 규칙이 `localStorage` 에 실제로 저장·복구되는지는 `useCartStore.persist.dom.test.ts`
 * 가 본다 — 저장은 DOM 이 있는 환경에서만 재현되는 별개 관심사다.
 *
 * 담은 순서는 어디에도 노출되지 않으므로 단언하지 않는다. 순서를 고정하면
 * 사용자에게 보이지 않는 것까지 잠가 리팩터링을 막는다.
 */

/** 이 테스트가 들고 있는 담긴 상품 목록. store 를 거치지 않는다. */
let cart: string[] = [];

/** 담아 둔 상품 수. */
const inCartCount = () => cart.length;

/** 이 상품이 담긴 것인지. */
const isInCart = (productId: string) => cart.includes(productId);

/** 사용자가 담기 버튼을 누른 것. */
const pressAddToCart = (productId: string) => {
  cart = toggleCartItem(cart, productId);
};

describe('장바구니', () => {
  beforeEach(() => {
    cart = [];
  });

  it('상품을 담으면 담긴 상품이 1개가 되고 그 상품은 담긴 것으로 남는다', () => {
    pressAddToCart('p1');

    expect(inCartCount()).toBe(1);
    expect(isInCart('p1')).toBe(true);
  });

  it('담긴 상품을 다시 누르면 빠져서 담긴 상품이 없어진다', () => {
    pressAddToCart('p1');

    pressAddToCart('p1');

    expect(inCartCount()).toBe(0);
    expect(isInCart('p1')).toBe(false);
  });

  it('서로 다른 상품을 담으면 담은 수만큼 늘어난다', () => {
    pressAddToCart('p1');
    pressAddToCart('p2');

    expect(inCartCount()).toBe(2);
    expect(isInCart('p1')).toBe(true);
    expect(isInCart('p2')).toBe(true);
  });

  it('여러 개를 담은 뒤 하나만 빼면 뺀 상품만 빠지고 나머지는 담긴 채로 남는다', () => {
    pressAddToCart('p1');
    pressAddToCart('p2');
    pressAddToCart('p3');

    pressAddToCart('p2');

    expect(inCartCount()).toBe(2);
    expect(isInCart('p2')).toBe(false);
    expect(isInCart('p1')).toBe(true);
    expect(isInCart('p3')).toBe(true);
  });

  /**
   * 경계 — 같은 버튼을 연달아 누르는 경우.
   * 담긴 수와 버튼 상태가 어긋나는 가장 흔한 경로다.
   */
  it('같은 상품을 두 번 담아도 담긴 상품이 2개가 되지는 않는다', () => {
    pressAddToCart('p1');
    pressAddToCart('p1');

    expect(inCartCount()).toBe(0);
  });

  it('같은 상품을 세 번 누르면 다시 담긴 상태가 된다', () => {
    pressAddToCart('p1');
    pressAddToCart('p1');
    pressAddToCart('p1');

    expect(inCartCount()).toBe(1);
    expect(isInCart('p1')).toBe(true);
  });

  // 경계 — 아무것도 담지 않은 처음 상태
  it('아무것도 담지 않았으면 담긴 상품이 없고 어떤 상품도 담긴 것으로 보이지 않는다', () => {
    expect(inCartCount()).toBe(0);
    expect(isInCart('p1')).toBe(false);
  });

  // 경계 — 담기지 않은 상품을 빼는 경우. 규칙이 목록을 건드리지 않아야 한다.
  it('담기지 않은 상품을 빼려 해도 담긴 상품은 그대로다', () => {
    pressAddToCart('p1');

    pressAddToCart('p2');
    pressAddToCart('p2');

    expect(inCartCount()).toBe(1);
    expect(isInCart('p1')).toBe(true);
  });
});
