import type { StateCreator } from 'zustand';

import type { WishlistSlice } from './wishlist-slice';

export type CartSlice = {
  cartProductIds: string[];
  toggleCart: (productId: string) => void;
};

export const createCartSlice: StateCreator<
  CartSlice & WishlistSlice,
  [],
  [],
  CartSlice
> = (set) => ({
  cartProductIds: [],
  toggleCart: (productId) =>
    set((state) => ({
      cartProductIds: state.cartProductIds.includes(productId)
        ? state.cartProductIds.filter((id) => id !== productId)
        : [...state.cartProductIds, productId],
    })),
});
