import type { CartStore } from "./cartStore";

export const selectCartProductQuantityMap = (state: CartStore) => state.cartProductQuantityMap;

export const selectCartCount = (state: CartStore) =>
  Object.values(state.cartProductQuantityMap).reduce((total, quantity) => total + quantity, 0);

export const selectIsProductInCart = (productId: string) => (state: CartStore) =>
  state.cartProductQuantityMap[productId] !== undefined;

export const selectAddCartItem = (state: CartStore) => state.addCartItem;

export const selectIncreaseCartQuantity = (state: CartStore) => state.increaseCartQuantity;

export const selectDecreaseCartQuantity = (state: CartStore) => state.decreaseCartQuantity;

export const selectClearCart = (state: CartStore) => state.clearCart;

export const selectCartHasHydrated = (state: CartStore) => state.hasHydrated;
