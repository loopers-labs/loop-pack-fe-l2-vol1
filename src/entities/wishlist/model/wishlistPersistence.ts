import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";
import type { WishlistStore } from "./wishlistStore";

export const WISHLIST_STORE_STORAGE_KEY = "anonymous-wishlist-store";
export const WISHLIST_STORE_VERSION = 1;

export type PersistedWishlistStore = {
  wishlistProductIdMap: IdSet;
};

export function selectPersistedWishlistState(state: WishlistStore): PersistedWishlistStore {
  return {
    wishlistProductIdMap: state.wishlistProductIdMap,
  };
}

export function normalizePersistedWishlistState(value: unknown): PersistedWishlistStore {
  if (!isObjectRecord(value)) {
    return createEmptyPersistedWishlistState();
  }

  return {
    wishlistProductIdMap: normalizeIdSet(value.wishlistProductIdMap),
  };
}

function createEmptyPersistedWishlistState(): PersistedWishlistStore {
  return {
    wishlistProductIdMap: {},
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
