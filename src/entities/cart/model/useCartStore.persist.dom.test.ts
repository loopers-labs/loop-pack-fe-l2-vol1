import { beforeEach, describe, expect, it } from 'vitest';

import { useCartStore } from './useCartStore';

/**
 * 검증 항목 1 (분리) — 장바구니 `persist` 왕복 (통합, jsdom)
 *
 * 파생 규칙은 `toggleCartItem.test.ts` 가 node 에서 본다. 여기서 보는 것은 **다른 관심사**다 —
 * 담아 둔 것이 브라우저 저장소에 남고, 다시 들어왔을 때 그대로 돌아오는가.
 *
 * 두 관심사를 한 파일에 두면 node 에서 `persist` 가 저장소를 찾지 못해 경고를 낸다.
 * 경고는 "이 테스트가 자기 환경에 없는 것을 전제한다"는 신호라, 억누르지 않고 파일을 갈랐다.
 *
 * 실제 문서 재로드까지 지나는 것은 항목 15(E2E)다. 여기서는 문서 재로드 대신
 * **메모리를 비우고 저장소만 남긴 상태에서 다시 세우는 것**으로 그 왕복을 재현한다.
 */

/** 이 슬라이스가 저장소에 쓰는 자리. persist key 라 슬라이스 안에서만 안다. */
const CART_STORAGE_KEY = 'commerce-cart';

/** 사용자가 담기 버튼을 누른 것. */
const pressAddToCart = (productId: string) => useCartStore.getState().toggleCart(productId);

/** 직전 방문이 저장소에 남긴 것. */
const lastVisitLeft = () => localStorage.getItem(CART_STORAGE_KEY);

/**
 * 저장소에 남은 것만 들고 다시 들어온 것.
 *
 * 메모리를 비우는 것 자체가 저장소에 빈 값을 쓰므로, 비운 **뒤에** 남아 있던 것을
 * 되돌려 놓아야 실제 재방문과 같은 상태가 된다.
 */
const revisitWith = async (saved: string | null) => {
  useCartStore.setState({ cart: [] });

  if (saved === null) {
    localStorage.removeItem(CART_STORAGE_KEY);
  } else {
    localStorage.setItem(CART_STORAGE_KEY, saved);
  }

  await useCartStore.persist.rehydrate();
};

describe('장바구니를 다시 들어와도 기억하는가', () => {
  beforeEach(() => {
    useCartStore.setState({ cart: [] });
    localStorage.clear();
  });

  it('담으면 브라우저 저장소에 그 상품이 남는다', () => {
    pressAddToCart('p1');

    expect(lastVisitLeft()).toContain('p1');
  });

  it('담아 둔 채로 다시 들어오면 담긴 상품이 그대로 있다', async () => {
    pressAddToCart('p1');
    pressAddToCart('p2');

    await revisitWith(lastVisitLeft());

    expect(useCartStore.getState().cart).toContain('p1');
    expect(useCartStore.getState().cart).toContain('p2');
  });

  /**
   * 경계 — 뺀 것도 저장돼야 한다.
   * 담을 때만 저장하고 뺄 때 저장하지 않으면, 뺐는데 다시 들어오면 살아 있다.
   */
  it('뺀 상품은 다시 들어와도 담겨 있지 않다', async () => {
    pressAddToCart('p1');
    pressAddToCart('p2');
    pressAddToCart('p1');

    await revisitWith(lastVisitLeft());

    expect(useCartStore.getState().cart).not.toContain('p1');
    expect(useCartStore.getState().cart).toContain('p2');
  });

  // 경계 — 처음 방문. 저장소에 아무것도 없어도 빈 장바구니로 시작한다.
  it('저장소에 아무것도 없으면 빈 장바구니로 시작한다', async () => {
    await revisitWith(null);

    expect(useCartStore.getState().cart).toHaveLength(0);
  });
});
