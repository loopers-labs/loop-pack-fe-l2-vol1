import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import {
  CART_STORE_STORAGE_KEY,
  CART_STORE_VERSION,
  normalizePersistedCartState,
  selectPersistedCartState,
} from "./cartPersistence";

export type CartStore = {
  cartProductIdMap: IdSet;
  toggleCart: (productId: string) => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartProductIdMap: {},
      toggleCart: (productId) => {
        set((state) => {
          const cartProductIdMap = normalizeIdSet(state.cartProductIdMap);

          if (cartProductIdMap[productId] === true) {
            const { [productId]: _removed, ...nextCartProductIdMap } = cartProductIdMap;

            return { cartProductIdMap: nextCartProductIdMap };
          }

          return { cartProductIdMap: { ...cartProductIdMap, [productId]: true } };
        });
      },
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: CART_STORE_STORAGE_KEY,
      version: CART_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: selectPersistedCartState,
      migrate: (persistedState) => normalizePersistedCartState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedCartState(persistedState),
      }),
      onRehydrateStorage: (state) => (hydratedState) => {
        const cartState = hydratedState ?? state;

        cartState.setHasHydrated(true);
      },
    },
  ),
);
