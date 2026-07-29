import type { WishlistSlice } from "./wishlistSlice";

export const selectWishlistCount = (state: WishlistSlice) =>
  Object.keys(state.wishlistProductIdMap).length;

export const selectIsProductInWishlist = (productId: string) => (state: WishlistSlice) =>
  state.wishlistProductIdMap[productId] === true;

export const selectToggleWishlist = (state: WishlistSlice) => state.toggleWishlist;
