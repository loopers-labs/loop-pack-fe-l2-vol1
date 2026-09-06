import { createJSONStorage } from 'zustand/middleware';
import {
  GUEST_CART_OWNER,
  LEGACY_CART_STORAGE_KEY,
  getCartStorageKey,
} from './cartOwner';
import type { PersistOptions } from 'zustand/middleware';
import type { CartItem, CartState } from './cartTypes';
import type { CartOwnerKey } from './cartOwner';

interface CartPersistedState {
  items: CartItem[];
}

function parsePersistedItems(value: unknown): Map<string, CartItem> {
  if (!value || typeof value !== 'object' || !('items' in value)) {
    return new Map();
  }

  const items = value.items;
  if (!Array.isArray(items)) return new Map();

  const parsed = new Map<string, CartItem>();
  items.forEach((item) => {
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      'quantity' in item &&
      typeof item.quantity === 'number' &&
      Number.isSafeInteger(item.quantity) &&
      item.quantity > 0
    ) {
      parsed.set(item.id, { id: item.id, quantity: item.quantity });
    }
  });

  return parsed;
}

function createOptions(
  ownerKey: CartOwnerKey,
): PersistOptions<CartState, CartPersistedState> {
  return {
    name: getCartStorageKey(ownerKey),
    version: 1,
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
    partialize: (state) => ({ items: Array.from(state.items.values()) }),
    merge: (persistedState, currentState) => ({
      ...currentState,
      items: parsePersistedItems(persistedState),
    }),
    migrate: (persistedState) => ({
      items: Array.from(parsePersistedItems(persistedState).values()),
    }),
  };
}

function migrateLegacyGuestCart(ownerKey: CartOwnerKey): void {
  if (ownerKey !== GUEST_CART_OWNER || typeof window === 'undefined') return;

  const guestStorageKey = getCartStorageKey(ownerKey);
  if (localStorage.getItem(guestStorageKey) !== null) return;

  const legacyValue = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
  if (legacyValue !== null) {
    localStorage.setItem(guestStorageKey, legacyValue);
  }
}

export const cartPersistence = {
  createOptions,
  migrateLegacyGuestCart,
};
