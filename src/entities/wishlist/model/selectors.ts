import type { WishlistStore } from "./wishlistStore";

export const selectWishlistCount = (state: WishlistStore) =>
  Object.keys(state.wishlistProductIdMap).length;

export const selectIsProductInWishlist = (productId: string) => (state: WishlistStore) =>
  state.wishlistProductIdMap[productId] === true;

export const selectToggleWishlist = (state: WishlistStore) => state.toggleWishlist;

export const selectWishlistHasHydrated = (state: WishlistStore) => state.hasHydrated;
