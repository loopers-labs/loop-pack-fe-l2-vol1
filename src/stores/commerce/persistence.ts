import type { CommerceStore } from "./store";

export const COMMERCE_STORE_STORAGE_KEY = "commerce-anonymous-store";
export const COMMERCE_STORE_VERSION = 1;

export type ProductIdMap = Record<string, true>;

export type PersistedCommerceStore = {
  cartProductIdMap: ProductIdMap;
  wishlistProductIdMap: ProductIdMap;
};

export function selectPersistedCommerceState(state: CommerceStore): PersistedCommerceStore {
  return {
    cartProductIdMap: state.cartProductIdMap,
    wishlistProductIdMap: state.wishlistProductIdMap,
  };
}

export function normalizePersistedCommerceState(value: unknown): PersistedCommerceStore {
  if (!isObjectRecord(value)) {
    return createEmptyPersistedCommerceState();
  }

  return {
    cartProductIdMap: normalizeProductIdMap(value.cartProductIdMap),
    wishlistProductIdMap: normalizeProductIdMap(value.wishlistProductIdMap),
  };
}

export function normalizeProductIdMap(value: unknown): ProductIdMap {
  if (!isObjectRecord(value)) {
    return {};
  }

  const productIdMap: ProductIdMap = {};

  Object.entries(value).forEach(([productId, included]) => {
    if (productId.trim().length > 0 && included === true) {
      productIdMap[productId] = true;
    }
  });

  return productIdMap;
}

function createEmptyPersistedCommerceState(): PersistedCommerceStore {
  return {
    cartProductIdMap: {},
    wishlistProductIdMap: {},
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
