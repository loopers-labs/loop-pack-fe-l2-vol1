import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createCartSlice } from "@/entities/cart";
import type { CartSlice } from "@/entities/cart";
import { createWishlistSlice } from "@/entities/wishlist";
import type { WishlistSlice } from "@/entities/wishlist";
import {
  COMMERCE_STORE_STORAGE_KEY,
  COMMERCE_STORE_VERSION,
  normalizePersistedCommerceState,
  selectPersistedCommerceState,
} from "./commercePersistence";

type CommerceHydrationState = {
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export type CommerceStore = CartSlice & WishlistSlice & CommerceHydrationState;

export const useCommerceStore = create<CommerceStore>()(
  persist(
    (...args) => {
      const [set] = args;

      return {
        ...createCartSlice<CommerceStore>()(...args),
        ...createWishlistSlice<CommerceStore>()(...args),
        hasHydrated: false,
        setHasHydrated: (hasHydrated) => {
          set({ hasHydrated });
        },
      };
    },
    {
      name: COMMERCE_STORE_STORAGE_KEY,
      version: COMMERCE_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: selectPersistedCommerceState,
      migrate: (persistedState) => normalizePersistedCommerceState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedCommerceState(persistedState),
      }),
      onRehydrateStorage: (state) => (hydratedState) => {
        const commerceState = hydratedState ?? state;

        commerceState.setHasHydrated(true);
      },
    },
  ),
);
