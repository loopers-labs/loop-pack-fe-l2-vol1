import { describe, expect, it } from "vitest";
import { selectCartCount } from "./selectors";
import type { CartStore } from "./cartStore";

describe("cart selectors", () => {
  it("장바구니 상품 id map에 담긴 상품 개수를 Header count 값으로 반환한다", () => {
    const count = selectCartCount(
      createCartStoreState({
        cartProductIdMap: { p1: true, p2: true, p3: true },
      }),
    );

    expect(count).toBe(3);
  });

  it("장바구니 상품 id map이 비어 있으면 Header count 값으로 0을 반환한다", () => {
    const count = selectCartCount(createCartStoreState({ cartProductIdMap: {} }));

    expect(count).toBe(0);
  });
});

function createCartStoreState(state: Pick<CartStore, "cartProductIdMap">): CartStore {
  return {
    cartProductIdMap: state.cartProductIdMap,
    toggleCart: () => undefined,
    hasHydrated: true,
    setHasHydrated: () => undefined,
  };
}
