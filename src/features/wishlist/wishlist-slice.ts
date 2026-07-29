import type { StateCreator } from 'zustand';

export type WishlistSlice = {
  wishlistProductIds: string[];
  toggleWishlist: (productId: string) => void;
};

export const createWishlistSlice: StateCreator<
  WishlistSlice,
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
