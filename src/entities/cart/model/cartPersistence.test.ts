import { describe, expect, it } from "vitest";
import {
  CART_STORE_STORAGE_KEY,
  CART_STORE_VERSION,
  normalizePersistedCartState,
  selectPersistedCartState,
} from "./cartPersistence";
import type { CartStore } from "./cartStore";

describe("cart persistence", () => {
  it("저장소 이름과 version을 고정한다", () => {
    expect(CART_STORE_STORAGE_KEY).toBe("anonymous-cart-store");
    expect(CART_STORE_VERSION).toBe(1);
  });

  it("저장 대상은 장바구니 상품 수량만 남긴다", () => {
    const persistedState = selectPersistedCartState({
      cartProductQuantityMap: { p1: 2 },
      addCartItem: () => undefined,
      increaseCartQuantity: () => undefined,
      decreaseCartQuantity: () => undefined,
      hasHydrated: true,
      setHasHydrated: () => undefined,
    } satisfies CartStore);

    expect(persistedState).toEqual({
      cartProductQuantityMap: { p1: 2 },
    });
  });

  it("잘못된 저장값은 빈 map으로 복구한다", () => {
    const persistedState = normalizePersistedCartState({
      cartProductQuantityMap: "wrong",
    });

    expect(persistedState).toEqual({
      cartProductQuantityMap: {},
    });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
  ])("저장 상태가 %s이면 빈 장바구니 상품 수량 map으로 복구한다", (_label, state) => {
    const persistedState = normalizePersistedCartState(state);

    expect(persistedState).toEqual({
      cartProductQuantityMap: {},
    });
  });

  it("양의 정수 수량을 가진 상품만 유지한다", () => {
    const persistedState = normalizePersistedCartState({
      cartProductQuantityMap: { p1: 2, p2: 0, p3: 1.5, p4: -1, p5: 1 },
    });

    expect(persistedState).toEqual({
      cartProductQuantityMap: { p1: 2, p5: 1 },
    });
  });

  it("기존 boolean 장바구니 저장값은 수량 1로 복구한다", () => {
    const persistedState = normalizePersistedCartState({
      cartProductIdMap: { p1: true, p2: false, p3: true },
    });

    expect(persistedState).toEqual({
      cartProductQuantityMap: { p1: 1, p3: 1 },
    });
  });
});
