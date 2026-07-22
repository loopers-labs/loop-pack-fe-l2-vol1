import type { StateCreator } from "zustand";
import { normalizeProductIdMap } from "./persistence";
import type { ProductIdMap } from "./persistence";
import type { CommerceStore } from "./store";

export type WishlistSlice = {
  wishlistProductIdMap: ProductIdMap;
  toggleWishlist: (productId: string) => void;
};

export const createWishlistSlice: StateCreator<CommerceStore, [], [], WishlistSlice> = (set) => ({
  wishlistProductIdMap: {},
  toggleWishlist: (productId) => {
    set((state) => {
      const wishlistProductIdMap = normalizeProductIdMap(state.wishlistProductIdMap);

      if (wishlistProductIdMap[productId] === true) {
        const { [productId]: _removed, ...nextWishlistProductIdMap } = wishlistProductIdMap;

        return { wishlistProductIdMap: nextWishlistProductIdMap };
      }

      return { wishlistProductIdMap: { ...wishlistProductIdMap, [productId]: true } };
    });
  },
});
