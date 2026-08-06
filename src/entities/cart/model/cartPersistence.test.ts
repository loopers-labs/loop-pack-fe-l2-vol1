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

  it("저장 대상은 장바구니 상품 id만 남긴다", () => {
    const persistedState = selectPersistedCartState({
      cartProductIdMap: { p1: true },
      toggleCart: () => undefined,
      hasHydrated: true,
      setHasHydrated: () => undefined,
    } satisfies CartStore);

    expect(persistedState).toEqual({
      cartProductIdMap: { p1: true },
    });
  });

  it("잘못된 저장값은 빈 map으로 복구한다", () => {
    const persistedState = normalizePersistedCartState({
      cartProductIdMap: "wrong",
    });

    expect(persistedState).toEqual({
      cartProductIdMap: {},
    });
  });

  it("true 값을 가진 상품 id map 저장값만 유지한다", () => {
    const persistedState = normalizePersistedCartState({
      cartProductIdMap: { p1: true, p2: false, p3: true },
    });

    expect(persistedState).toEqual({
      cartProductIdMap: { p1: true, p3: true },
    });
  });
});
