import type { StateCreator } from "zustand";
import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";

export type WishlistSlice = {
  wishlistProductIdMap: IdSet;
  toggleWishlist: (productId: string) => void;
};

export function createWishlistSlice<Store extends WishlistSlice>(): StateCreator<
  Store,
  [],
  [],
  WishlistSlice
> {
  return (set) => ({
    wishlistProductIdMap: {},
    toggleWishlist: (productId) => {
      set((state) => {
        const wishlistProductIdMap = normalizeIdSet(state.wishlistProductIdMap);

        if (wishlistProductIdMap[productId] === true) {
          const { [productId]: _removed, ...nextWishlistProductIdMap } = wishlistProductIdMap;

          return { wishlistProductIdMap: nextWishlistProductIdMap } as Partial<Store>;
        }

        return {
          wishlistProductIdMap: { ...wishlistProductIdMap, [productId]: true },
        } as Partial<Store>;
      });
    },
  });
}
