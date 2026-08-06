import type { CartStore } from "./cartStore";

export const selectCartCount = (state: CartStore) => Object.keys(state.cartProductIdMap).length;

export const selectIsProductInCart = (productId: string) => (state: CartStore) =>
  state.cartProductIdMap[productId] === true;

export const selectToggleCart = (state: CartStore) => state.toggleCart;

export const selectCartHasHydrated = (state: CartStore) => state.hasHydrated;
