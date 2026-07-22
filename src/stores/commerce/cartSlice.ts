import type { StateCreator } from "zustand";
import { normalizeProductIdMap } from "./persistence";
import type { ProductIdMap } from "./persistence";
import type { CommerceStore } from "./store";

export type CartSlice = {
  cartProductIdMap: ProductIdMap;
  toggleCart: (productId: string) => void;
};

export const createCartSlice: StateCreator<CommerceStore, [], [], CartSlice> = (set) => ({
  cartProductIdMap: {},
  toggleCart: (productId) => {
    set((state) => {
      const cartProductIdMap = normalizeProductIdMap(state.cartProductIdMap);

      if (cartProductIdMap[productId] === true) {
        const { [productId]: _removed, ...nextCartProductIdMap } = cartProductIdMap;

        return { cartProductIdMap: nextCartProductIdMap };
      }

      return { cartProductIdMap: { ...cartProductIdMap, [productId]: true } };
    });
  },
});
