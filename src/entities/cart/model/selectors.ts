import type { CartSlice } from "./cartSlice";

export const selectCartCount = (state: CartSlice) => Object.keys(state.cartProductIdMap).length;

export const selectIsProductInCart = (productId: string) => (state: CartSlice) =>
  state.cartProductIdMap[productId] === true;

export const selectToggleCart = (state: CartSlice) => state.toggleCart;
