import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CART_STORE_STORAGE_KEY,
  CART_STORE_VERSION,
  normalizeCartProductQuantityMap,
  normalizePersistedCartState,
  selectPersistedCartState,
} from "./cartPersistence";
import type { CartProductQuantityMap } from "./cartPersistence";

export type CartStore = {
  cartProductQuantityMap: CartProductQuantityMap;
  addCartItem: (productId: string) => void;
  increaseCartQuantity: (productId: string) => void;
  decreaseCartQuantity: (productId: string) => void;
  clearCart: () => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartProductQuantityMap: {},
      addCartItem: (productId) => {
        set((state) => {
          const cartProductQuantityMap =
            normalizeCartProductQuantityMap(state.cartProductQuantityMap) ?? {};
          const currentQuantity = cartProductQuantityMap[productId] ?? 0;

          return {
            cartProductQuantityMap: {
              ...cartProductQuantityMap,
              [productId]: currentQuantity + 1,
            },
          };
        });
      },
      increaseCartQuantity: (productId) => {
        set((state) => {
          const cartProductQuantityMap =
            normalizeCartProductQuantityMap(state.cartProductQuantityMap) ?? {};
          const currentQuantity = cartProductQuantityMap[productId] ?? 0;

          return {
            cartProductQuantityMap: {
              ...cartProductQuantityMap,
              [productId]: currentQuantity + 1,
            },
          };
        });
      },
      decreaseCartQuantity: (productId) => {
        set((state) => {
          const cartProductQuantityMap =
            normalizeCartProductQuantityMap(state.cartProductQuantityMap) ?? {};
          const currentQuantity = cartProductQuantityMap[productId] ?? 0;

          if (currentQuantity <= 1) {
            const { [productId]: _removed, ...nextCartProductQuantityMap } = cartProductQuantityMap;

            return { cartProductQuantityMap: nextCartProductQuantityMap };
          }

          return {
            cartProductQuantityMap: {
              ...cartProductQuantityMap,
              [productId]: currentQuantity - 1,
            },
          };
        });
      },
      clearCart: () => {
        set({ cartProductQuantityMap: {} });
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
