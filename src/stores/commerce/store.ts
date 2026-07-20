import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createCartSlice } from "./cartSlice";
import type { CartSlice } from "./cartSlice";
import {
  COMMERCE_STORE_STORAGE_KEY,
  COMMERCE_STORE_VERSION,
  normalizePersistedCommerceState,
  selectPersistedCommerceState,
} from "./persistence";
import { createWishlistSlice } from "./wishlistSlice";
import type { WishlistSlice } from "./wishlistSlice";

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
        ...createCartSlice(...args),
        ...createWishlistSlice(...args),
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
