import type { StateCreator } from "zustand";
import { normalizeProductIds } from "./persistence";
import type { CommerceStore } from "./store";

export type WishlistSlice = {
  wishlistProductIds: string[];
  toggleWishlist: (productId: string) => void;
};

export const createWishlistSlice: StateCreator<CommerceStore, [], [], WishlistSlice> = (set) => ({
  wishlistProductIds: [],
  toggleWishlist: (productId) => {
    set((state) => {
      const wishlistProductIds = normalizeProductIds(state.wishlistProductIds);

      return {
        wishlistProductIds: wishlistProductIds.includes(productId)
          ? wishlistProductIds.filter((id) => id !== productId)
          : [...wishlistProductIds, productId],
      };
    });
  },
});
