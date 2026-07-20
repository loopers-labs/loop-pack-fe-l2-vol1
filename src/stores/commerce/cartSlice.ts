import type { StateCreator } from "zustand";
import { normalizeProductIds } from "./persistence";
import type { CommerceStore } from "./store";

export type CartSlice = {
  cartProductIds: string[];
  toggleCart: (productId: string) => void;
};

export const createCartSlice: StateCreator<CommerceStore, [], [], CartSlice> = (set) => ({
  cartProductIds: [],
  toggleCart: (productId) => {
    set((state) => {
      const cartProductIds = normalizeProductIds(state.cartProductIds);

      return {
        cartProductIds: cartProductIds.includes(productId)
          ? cartProductIds.filter((id) => id !== productId)
          : [...cartProductIds, productId],
      };
    });
  },
});
