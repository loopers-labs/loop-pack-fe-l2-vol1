import { describe, expect, it } from "vitest";
import {
  normalizePersistedWishlistState,
  selectPersistedWishlistState,
  WISHLIST_STORE_STORAGE_KEY,
  WISHLIST_STORE_VERSION,
} from "./wishlistPersistence";
import type { WishlistStore } from "./wishlistStore";

describe("wishlist persistence", () => {
  it("저장소 이름과 version을 고정한다", () => {
    expect(WISHLIST_STORE_STORAGE_KEY).toBe("anonymous-wishlist-store");
    expect(WISHLIST_STORE_VERSION).toBe(1);
  });

  it("저장 대상은 위시리스트 상품 id만 남긴다", () => {
    const persistedState = selectPersistedWishlistState({
      wishlistProductIdMap: { p1: true },
      toggleWishlist: () => undefined,
      hasHydrated: true,
      setHasHydrated: () => undefined,
    } satisfies WishlistStore);

    expect(persistedState).toEqual({
      wishlistProductIdMap: { p1: true },
    });
  });

  it("잘못된 저장값은 빈 map으로 복구한다", () => {
    const persistedState = normalizePersistedWishlistState({
      wishlistProductIdMap: "wrong",
    });

    expect(persistedState).toEqual({
      wishlistProductIdMap: {},
    });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
  ])("저장 상태가 %s이면 빈 위시리스트 상품 id map으로 복구한다", (_label, state) => {
    const persistedState = normalizePersistedWishlistState(state);

    expect(persistedState).toEqual({
      wishlistProductIdMap: {},
    });
  });

  it("true 값을 가진 상품 id map 저장값만 유지한다", () => {
    const persistedState = normalizePersistedWishlistState({
      wishlistProductIdMap: { p1: true, p2: false, p3: true },
    });

    expect(persistedState).toEqual({
      wishlistProductIdMap: { p1: true, p3: true },
    });
  });
});
