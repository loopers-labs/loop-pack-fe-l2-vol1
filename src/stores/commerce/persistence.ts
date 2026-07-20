import type { CommerceStore } from "./store";

export const COMMERCE_STORE_STORAGE_KEY = "commerce-anonymous-store";
export const COMMERCE_STORE_VERSION = 1;

export type PersistedCommerceStore = {
  cartProductIds: string[];
  wishlistProductIds: string[];
};

export function selectPersistedCommerceState(state: CommerceStore): PersistedCommerceStore {
  return {
    cartProductIds: state.cartProductIds,
    wishlistProductIds: state.wishlistProductIds,
  };
}

export function normalizePersistedCommerceState(value: unknown): PersistedCommerceStore {
  if (!isObjectRecord(value)) {
    return createEmptyPersistedCommerceState();
  }

  return {
    cartProductIds: normalizeProductIds(value.cartProductIds),
    wishlistProductIds: normalizeProductIds(value.wishlistProductIds),
  };
}

export function normalizeProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const productIds = value.filter((item): item is string => {
    return typeof item === "string" && item.trim().length > 0;
  });

  return Array.from(new Set(productIds));
}

function createEmptyPersistedCommerceState(): PersistedCommerceStore {
  return {
    cartProductIds: [],
    wishlistProductIds: [],
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
