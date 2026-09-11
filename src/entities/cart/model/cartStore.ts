import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CART_STORE_STORAGE_KEY,
  CART_STORE_VERSION,
  normalizeCartProductQuantityMap,
  normalizePersistedCartState,
  selectPersistedCartState,
} from "./cartPersistence";
import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import type { CartProductQuantityMap } from "./cartPersistence";

export type CartStore = {
  cartProductQuantityMap: CartProductQuantityMap;
  selectedCartProductIdMap: IdSet;
  addCartItem: (productId: string) => void;
  increaseCartQuantity: (productId: string) => void;
  decreaseCartQuantity: (productId: string) => void;
  clearCart: () => void;
  toggleCartItemSelection: (productId: string) => void;
  removeSelectedCartItems: () => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartProductQuantityMap: {},
      selectedCartProductIdMap: {},
      addCartItem: (productId) => {
        set((state) => {
          const cartProductQuantityMap =
            normalizeCartProductQuantityMap(state.cartProductQuantityMap) ?? {};
          const selectedCartProductIdMap = normalizeIdSet(state.selectedCartProductIdMap);
          const currentQuantity = cartProductQuantityMap[productId] ?? 0;

          return {
            cartProductQuantityMap: {
              ...cartProductQuantityMap,
              [productId]: currentQuantity + 1,
            },
            selectedCartProductIdMap: {
              ...selectedCartProductIdMap,
              [productId]: true,
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
            const { [productId]: _unselected, ...nextSelectedCartProductIdMap } = normalizeIdSet(
              state.selectedCartProductIdMap,
            );

            return {
              cartProductQuantityMap: nextCartProductQuantityMap,
              selectedCartProductIdMap: nextSelectedCartProductIdMap,
            };
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
        set({ cartProductQuantityMap: {}, selectedCartProductIdMap: {} });
      },
      toggleCartItemSelection: (productId) => {
        set((state) => {
          const cartProductQuantityMap =
            normalizeCartProductQuantityMap(state.cartProductQuantityMap) ?? {};

          if (cartProductQuantityMap[productId] === undefined) {
            return {};
          }

          const selectedCartProductIdMap = normalizeIdSet(state.selectedCartProductIdMap);
          if (selectedCartProductIdMap[productId] === true) {
            const { [productId]: _removed, ...nextSelectedCartProductIdMap } =
              selectedCartProductIdMap;

            return { selectedCartProductIdMap: nextSelectedCartProductIdMap };
          }

          return {
            selectedCartProductIdMap: {
              ...selectedCartProductIdMap,
              [productId]: true,
            },
          };
        });
      },
      removeSelectedCartItems: () => {
        set((state) => {
          const selectedProductIds = new Set(
            Object.keys(normalizeIdSet(state.selectedCartProductIdMap)),
          );
          const cartProductQuantityMap =
            normalizeCartProductQuantityMap(state.cartProductQuantityMap) ?? {};

          return {
            cartProductQuantityMap: Object.fromEntries(
              Object.entries(cartProductQuantityMap).filter(
                ([productId]) => !selectedProductIds.has(productId),
              ),
            ),
            selectedCartProductIdMap: {},
          };
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
