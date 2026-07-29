import { describe, expect, it } from "vitest";
import {
  COMMERCE_STORE_STORAGE_KEY,
  COMMERCE_STORE_VERSION,
  normalizePersistedCommerceState,
  selectPersistedCommerceState,
} from "./commercePersistence";
import type { CommerceStore } from "./commerceStore";

describe("commerce persistence", () => {
  it("저장소 이름과 version을 고정한다", () => {
    expect(COMMERCE_STORE_STORAGE_KEY).toBe("commerce-anonymous-store");
    expect(COMMERCE_STORE_VERSION).toBe(1);
  });

  it("저장 대상은 장바구니와 위시리스트 상품 id만 남긴다", () => {
    const persistedState = selectPersistedCommerceState({
      cartProductIdMap: { p1: true },
      wishlistProductIdMap: { p2: true },
      toggleCart: () => undefined,
      toggleWishlist: () => undefined,
      hasHydrated: true,
      setHasHydrated: () => undefined,
    } satisfies CommerceStore);

    expect(persistedState).toEqual({
      cartProductIdMap: { p1: true },
      wishlistProductIdMap: { p2: true },
    });
  });

  it("잘못된 저장값은 빈 map으로 복구한다", () => {
    const persistedState = normalizePersistedCommerceState({
      cartProductIdMap: "wrong",
      wishlistProductIdMap: null,
    });

    expect(persistedState).toEqual({
      cartProductIdMap: {},
      wishlistProductIdMap: {},
    });
  });

  it("true 값을 가진 상품 id map 저장값만 유지한다", () => {
    const persistedState = normalizePersistedCommerceState({
      cartProductIdMap: { p1: true, p2: false, p3: true },
      wishlistProductIdMap: { p4: true, p5: "wrong", p6: true },
    });

    expect(persistedState).toEqual({
      cartProductIdMap: { p1: true, p3: true },
      wishlistProductIdMap: { p4: true, p6: true },
    });
  });

  it("배열 저장값은 현재 map 스키마가 아니므로 빈 map으로 정리한다", () => {
    const persistedState = normalizePersistedCommerceState({
      cartProductIds: ["p1", "p1", "", "   ", "p2"],
      wishlistProductIds: ["", "p3", "p3", "  "],
    });

    expect(persistedState).toEqual({
      cartProductIdMap: {},
      wishlistProductIdMap: {},
    });
  });
});
