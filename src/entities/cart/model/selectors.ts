import type { CartStore } from "./cartStore";

export const selectCartProductQuantityMap = (state: CartStore) => state.cartProductQuantityMap;

export const selectSelectedCartProductIdMap = (state: CartStore) => state.selectedCartProductIdMap;

export const selectCartCount = (state: CartStore) =>
  Object.values(state.cartProductQuantityMap).reduce((total, quantity) => total + quantity, 0);

export const selectSelectedCartCount = (state: CartStore) =>
  Object.entries(state.cartProductQuantityMap).reduce(
    (total, [productId, quantity]) =>
      state.selectedCartProductIdMap[productId] === true ? total + quantity : total,
    0,
  );

export const selectIsProductInCart = (productId: string) => (state: CartStore) =>
  state.cartProductQuantityMap[productId] !== undefined;

export const selectAddCartItem = (state: CartStore) => state.addCartItem;

export const selectIncreaseCartQuantity = (state: CartStore) => state.increaseCartQuantity;

export const selectDecreaseCartQuantity = (state: CartStore) => state.decreaseCartQuantity;

export const selectClearCart = (state: CartStore) => state.clearCart;

export const selectToggleCartItemSelection = (state: CartStore) => state.toggleCartItemSelection;

export const selectRemoveSelectedCartItems = (state: CartStore) => state.removeSelectedCartItems;

export const selectCartHasHydrated = (state: CartStore) => state.hasHydrated;
