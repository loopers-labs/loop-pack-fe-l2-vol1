import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import type { CartStore } from "./cartStore";

export const CART_STORE_STORAGE_KEY = "anonymous-cart-store";
export const CART_STORE_VERSION = 1;

export type PersistedCartStore = {
  cartProductIdMap: IdSet;
};

export function selectPersistedCartState(state: CartStore): PersistedCartStore {
  return {
    cartProductIdMap: state.cartProductIdMap,
  };
}

export function normalizePersistedCartState(value: unknown): PersistedCartStore {
  if (!isObjectRecord(value)) {
    return createEmptyPersistedCartState();
  }

  return {
    cartProductIdMap: normalizeIdSet(value.cartProductIdMap),
  };
}

function createEmptyPersistedCartState(): PersistedCartStore {
  return {
    cartProductIdMap: {},
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
