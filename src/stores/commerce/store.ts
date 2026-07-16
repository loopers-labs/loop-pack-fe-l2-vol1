import { create } from "zustand";
import { createCartSlice } from "./cartSlice";
import type { CartSlice } from "./cartSlice";
import { createWishlistSlice } from "./wishlistSlice";
import type { WishlistSlice } from "./wishlistSlice";

export type CommerceStore = CartSlice & WishlistSlice;

export const useCommerceStore = create<CommerceStore>()((...args) => ({
  ...createCartSlice(...args),
  ...createWishlistSlice(...args),
}));
