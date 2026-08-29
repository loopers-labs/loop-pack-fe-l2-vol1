import { describe, expect, it } from "vitest";
import { selectCartCount } from "./selectors";
import type { CartStore } from "./cartStore";

describe("cart selectors", () => {
  it("장바구니 상품 수량 합계를 Header count 값으로 반환한다", () => {
    const count = selectCartCount(
      createCartStoreState({
        cartProductQuantityMap: { p1: 2, p2: 1, p3: 3 },
      }),
    );

    expect(count).toBe(6);
  });

  it("장바구니 상품 수량 map이 비어 있으면 Header count 값으로 0을 반환한다", () => {
    const count = selectCartCount(createCartStoreState({ cartProductQuantityMap: {} }));

    expect(count).toBe(0);
  });
});

function createCartStoreState(state: Pick<CartStore, "cartProductQuantityMap">): CartStore {
  return {
    cartProductQuantityMap: state.cartProductQuantityMap,
    addCartItem: () => undefined,
    increaseCartQuantity: () => undefined,
    decreaseCartQuantity: () => undefined,
    hasHydrated: true,
    setHasHydrated: () => undefined,
  };
}
