import { describe, expect, it } from "vitest";
import { selectWishlistCount } from "./selectors";
import type { WishlistStore } from "./wishlistStore";

describe("wishlist selectors", () => {
  it("위시리스트 상품 id map에 담긴 상품 개수를 Header count 값으로 반환한다", () => {
    const count = selectWishlistCount(
      createWishlistStoreState({
        wishlistProductIdMap: { p1: true, p2: true },
      }),
    );

    expect(count).toBe(2);
  });

  it("위시리스트 상품 id map이 비어 있으면 Header count 값으로 0을 반환한다", () => {
    const count = selectWishlistCount(createWishlistStoreState({ wishlistProductIdMap: {} }));

    expect(count).toBe(0);
  });
});

function createWishlistStoreState(
  state: Pick<WishlistStore, "wishlistProductIdMap">,
): WishlistStore {
  return {
    wishlistProductIdMap: state.wishlistProductIdMap,
    toggleWishlist: () => undefined,
    hasHydrated: true,
    setHasHydrated: () => undefined,
  };
}
