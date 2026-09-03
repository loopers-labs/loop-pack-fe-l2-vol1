import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import type { CartStore } from "./cartStore";

export const CART_STORE_STORAGE_KEY = "anonymous-cart-store";
export const CART_STORE_VERSION = 1;

export type CartProductQuantityMap = Record<string, number>;

export type PersistedCartStore = {
  cartProductQuantityMap: CartProductQuantityMap;
  selectedCartProductIdMap: IdSet;
};

export function selectPersistedCartState(state: CartStore): PersistedCartStore {
  return {
    cartProductQuantityMap: state.cartProductQuantityMap,
    selectedCartProductIdMap: state.selectedCartProductIdMap,
  };
}

export function normalizePersistedCartState(value: unknown): PersistedCartStore {
  if (!isObjectRecord(value)) {
    return createEmptyPersistedCartState();
  }

  const cartProductQuantityMap =
    normalizeCartProductQuantityMap(value.cartProductQuantityMap) ??
    normalizeLegacyCartProductIdMap(value.cartProductIdMap);

  return {
    cartProductQuantityMap,
    selectedCartProductIdMap: normalizeSelectedCartProductIdMap(
      value.selectedCartProductIdMap,
      cartProductQuantityMap,
    ),
  };
}

function createEmptyPersistedCartState(): PersistedCartStore {
  return {
    cartProductQuantityMap: {},
    selectedCartProductIdMap: {},
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

function normalizeSelectedCartProductIdMap(
  value: unknown,
  cartProductQuantityMap: CartProductQuantityMap,
): IdSet {
  if (!isObjectRecord(value)) {
    return Object.fromEntries(
      Object.keys(cartProductQuantityMap).map((productId) => [productId, true]),
    );
  }

  const selectedCartProductIdMap = normalizeIdSet(value);
  const cartProductIds = new Set(Object.keys(cartProductQuantityMap));

  return Object.fromEntries(
    Object.entries(selectedCartProductIdMap).filter(([productId]) => cartProductIds.has(productId)),
  );
}
