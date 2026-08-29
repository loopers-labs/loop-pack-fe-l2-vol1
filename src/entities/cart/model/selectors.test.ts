import { describe, expect, it } from "vitest";
import { selectCartCount, selectSelectedCartCount } from "./selectors";
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

  it("선택된 장바구니 상품 수량 합계를 주문 대상 count 값으로 반환한다", () => {
    const count = selectSelectedCartCount(
      createCartStoreState({
        cartProductQuantityMap: { p1: 2, p2: 1 },
        selectedCartProductIdMap: { p1: true },
      }),
    );

    expect(count).toBe(2);
  });
});

function createCartStoreState(
  state: Pick<CartStore, "cartProductQuantityMap"> &
    Partial<Pick<CartStore, "selectedCartProductIdMap">>,
): CartStore {
  return {
    cartProductQuantityMap: state.cartProductQuantityMap,
    selectedCartProductIdMap: state.selectedCartProductIdMap ?? {},
    addCartItem: () => undefined,
    increaseCartQuantity: () => undefined,
    decreaseCartQuantity: () => undefined,
    clearCart: () => undefined,
    toggleCartItemSelection: () => undefined,
    removeSelectedCartItems: () => undefined,
    hasHydrated: true,
    setHasHydrated: () => undefined,
  };
}
