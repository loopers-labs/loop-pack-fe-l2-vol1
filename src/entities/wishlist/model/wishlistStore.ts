import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import {
  normalizePersistedWishlistState,
  selectPersistedWishlistState,
  WISHLIST_STORE_STORAGE_KEY,
  WISHLIST_STORE_VERSION,
} from "./wishlistPersistence";

export type WishlistStore = {
  wishlistProductIdMap: IdSet;
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      wishlistProductIdMap: {},
      toggleWishlist: (productId) => {
        set((state) => {
          const wishlistProductIdMap = normalizeIdSet(state.wishlistProductIdMap);

          if (wishlistProductIdMap[productId] === true) {
            const { [productId]: _removed, ...nextWishlistProductIdMap } = wishlistProductIdMap;

            return { wishlistProductIdMap: nextWishlistProductIdMap };
          }

          return {
            wishlistProductIdMap: { ...wishlistProductIdMap, [productId]: true },
          };
        });
      },
      clearWishlist: () => {
        set({ wishlistProductIdMap: {} });
      },
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: WISHLIST_STORE_STORAGE_KEY,
      version: WISHLIST_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: selectPersistedWishlistState,
      migrate: (persistedState) => normalizePersistedWishlistState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedWishlistState(persistedState),
      }),
      onRehydrateStorage: (state) => (hydratedState) => {
        const wishlistState = hydratedState ?? state;

        wishlistState.setHasHydrated(true);
      },
    },
  ),
);
