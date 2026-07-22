import type { StateCreator } from 'zustand';

import type { CartSlice } from './cart-slice';

export type WishlistSlice = {
  wishlistProductIds: string[];
  toggleWishlist: (productId: string) => void;
};

export const createWishlistSlice: StateCreator<
  CartSlice & WishlistSlice,
  [],
  [],
  WishlistSlice
> = (set) => ({
  wishlistProductIds: [],
  toggleWishlist: (productId) =>
    set((state) => ({
      wishlistProductIds: state.wishlistProductIds.includes(productId)
        ? state.wishlistProductIds.filter((id) => id !== productId)
        : [...state.wishlistProductIds, productId],
    })),
});
