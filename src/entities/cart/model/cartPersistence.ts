import type { CartStore } from "./cartStore";

export const CART_STORE_STORAGE_KEY = "anonymous-cart-store";
export const CART_STORE_VERSION = 1;

export type CartProductQuantityMap = Record<string, number>;

export type PersistedCartStore = {
  cartProductQuantityMap: CartProductQuantityMap;
};

export function selectPersistedCartState(state: CartStore): PersistedCartStore {
  return {
    cartProductQuantityMap: state.cartProductQuantityMap,
  };
}

export function normalizePersistedCartState(value: unknown): PersistedCartStore {
  if (!isObjectRecord(value)) {
    return createEmptyPersistedCartState();
  }

  return {
    cartProductQuantityMap:
      normalizeCartProductQuantityMap(value.cartProductQuantityMap) ??
      normalizeLegacyCartProductIdMap(value.cartProductIdMap),
  };
}

function createEmptyPersistedCartState(): PersistedCartStore {
  return {
    cartProductQuantityMap: {},
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeCartProductQuantityMap(value: unknown): CartProductQuantityMap | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const cartProductQuantityMap: CartProductQuantityMap = {};

  Object.entries(value).forEach(([productId, quantity]) => {
    if (
      productId.trim().length > 0 &&
      typeof quantity === "number" &&
      Number.isInteger(quantity) &&
      quantity > 0
    ) {
      cartProductQuantityMap[productId] = quantity;
    }
  });

  return cartProductQuantityMap;
}

function normalizeLegacyCartProductIdMap(value: unknown): CartProductQuantityMap {
  if (!isObjectRecord(value)) {
    return {};
  }

  const cartProductQuantityMap: CartProductQuantityMap = {};

  Object.entries(value).forEach(([productId, included]) => {
    if (productId.trim().length > 0 && included === true) {
      cartProductQuantityMap[productId] = 1;
    }
  });

  return cartProductQuantityMap;
}
