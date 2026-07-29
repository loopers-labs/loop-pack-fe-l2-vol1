import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import type { CommerceStore } from "./commerceStore";

export const COMMERCE_STORE_STORAGE_KEY = "commerce-anonymous-store";
export const COMMERCE_STORE_VERSION = 1;

export type PersistedCommerceStore = {
  cartProductIdMap: IdSet;
  wishlistProductIdMap: IdSet;
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
    cartProductIdMap: normalizeIdSet(value.cartProductIdMap),
    wishlistProductIdMap: normalizeIdSet(value.wishlistProductIdMap),
  };
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
