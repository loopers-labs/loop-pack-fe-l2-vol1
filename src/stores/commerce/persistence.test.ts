import { describe, expect, it } from "vitest";
import {
  COMMERCE_STORE_STORAGE_KEY,
  COMMERCE_STORE_VERSION,
  normalizePersistedCommerceState,
  selectPersistedCommerceState,
} from "./persistence";
import type { CommerceStore } from "./store";

describe("commerce persistence", () => {
  it("저장소 이름과 version을 고정한다", () => {
    expect(COMMERCE_STORE_STORAGE_KEY).toBe("commerce-anonymous-store");
    expect(COMMERCE_STORE_VERSION).toBe(1);
  });

  it("저장 대상은 장바구니와 위시리스트 상품 id만 남긴다", () => {
    const persistedState = selectPersistedCommerceState({
      cartProductIds: ["p1"],
      wishlistProductIds: ["p2"],
      toggleCart: () => undefined,
      toggleWishlist: () => undefined,
      hasHydrated: true,
      setHasHydrated: () => undefined,
    } satisfies CommerceStore);

    expect(persistedState).toEqual({
      cartProductIds: ["p1"],
      wishlistProductIds: ["p2"],
    });
  });

  it("잘못된 저장값은 빈 배열로 복구한다", () => {
    const persistedState = normalizePersistedCommerceState({
      cartProductIds: "wrong",
      wishlistProductIds: null,
    });

    expect(persistedState).toEqual({
      cartProductIds: [],
      wishlistProductIds: [],
    });
  });

  it("문자열 배열 저장값만 유지한다", () => {
    const persistedState = normalizePersistedCommerceState({
      cartProductIds: ["p1", 1, "p2", null],
      wishlistProductIds: [false, "p3", undefined],
    });

    expect(persistedState).toEqual({
      cartProductIds: ["p1", "p2"],
      wishlistProductIds: ["p3"],
    });
  });

  it("중복되거나 비어 있는 상품 id는 저장값에서 제거한다", () => {
    const persistedState = normalizePersistedCommerceState({
      cartProductIds: ["p1", "p1", "", "   ", "p2"],
      wishlistProductIds: ["", "p3", "p3", "  "],
    });

    expect(persistedState).toEqual({
      cartProductIds: ["p1", "p2"],
      wishlistProductIds: ["p3"],
    });
  });
});
