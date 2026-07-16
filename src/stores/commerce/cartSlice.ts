import type { StateCreator } from "zustand";
import type { CommerceStore } from "./store";

export type CartSlice = {
  cartProductIds: string[];
  toggleCart: (productId: string) => void;
};

export const createCartSlice: StateCreator<CommerceStore, [], [], CartSlice> = (set) => ({
  cartProductIds: [],
  toggleCart: (productId) => {
    set((state) => ({
      cartProductIds: state.cartProductIds.includes(productId)
        ? state.cartProductIds.filter((id) => id !== productId)
        : [...state.cartProductIds, productId],
    }));
  },
});
