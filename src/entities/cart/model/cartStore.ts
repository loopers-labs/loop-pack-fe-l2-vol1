'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  GUEST_CART_OWNER,
  LEGACY_CART_STORAGE_KEY,
  getCartStorageKey,
} from './cartOwner';
import type { ReactNode } from 'react';
import type { CartOwnerKey } from './cartOwner';

export interface CartItem {
  id: string;
  quantity: number;
}

export interface CartState {
  ownerKey: CartOwnerKey;
  items: Map<string, CartItem>;
  lastAddedId: string | null;
  isHydrated: boolean;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  clearLastAdded: () => void;
  setHydrated: () => void;
}

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

export function createCartStore(ownerKey: CartOwnerKey) {
  const pendingItemIds: string[] = [];

  return createStore<CartState>()(
    persist<CartState, [], [], CartPersistedState>(
      (set, get) => ({
        ownerKey,
        items: new Map(),
        lastAddedId: null,
        isHydrated: false,

        addItem: (id) => {
          if (!get().isHydrated) {
            pendingItemIds.push(id);
            return;
          }

          set((state) => {
            const next = new Map(state.items);
            const existing = next.get(id);
            next.set(id, {
              id,
              quantity: existing ? existing.quantity + 1 : 1,
            });
            return { items: next, lastAddedId: id };
          });
        },

        removeItem: (id) =>
          set((state) => {
            const next = new Map(state.items);
            next.delete(id);
            return { items: next };
          }),

        clearItems: () => set({ items: new Map(), lastAddedId: null }),
        clearLastAdded: () => set({ lastAddedId: null }),
        setHydrated: () =>
          set((state) => {
            const next = new Map(state.items);
            pendingItemIds.forEach((id) => {
              const existing = next.get(id);
              next.set(id, {
                id,
                quantity: existing ? existing.quantity + 1 : 1,
              });
            });

            const lastAddedId = pendingItemIds.at(-1) ?? state.lastAddedId;
            pendingItemIds.length = 0;

            return { items: next, lastAddedId, isHydrated: true };
          }),
      }),
      {
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
      },
    ),
  );
}

export type CartStore = ReturnType<typeof createCartStore>;

const CartStoreContext = createContext<CartStore | null>(null);
const defaultCartStore = createCartStore(GUEST_CART_OWNER);

function migrateLegacyGuestCart(ownerKey: CartOwnerKey) {
  if (ownerKey !== GUEST_CART_OWNER || typeof window === 'undefined') return;

  const guestStorageKey = getCartStorageKey(ownerKey);
  if (localStorage.getItem(guestStorageKey) !== null) return;

  const legacyValue = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
  if (legacyValue !== null) {
    localStorage.setItem(guestStorageKey, legacyValue);
  }
}

interface CartStoreProviderProps {
  ownerKey: CartOwnerKey;
  children: ReactNode;
}

export function CartStoreProvider({
  ownerKey,
  children,
}: CartStoreProviderProps) {
  const store = useMemo(() => createCartStore(ownerKey), [ownerKey]);

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      migrateLegacyGuestCart(ownerKey);

      try {
        await Promise.resolve(store.persist.rehydrate());
      } finally {
        if (isActive) {
          store.getState().setHydrated();
        }
      }
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [ownerKey, store]);

  return createElement(CartStoreContext.Provider, { value: store }, children);
}

function useCartStoreSelector<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartStoreContext) ?? defaultCartStore;
  return useStore(store, selector);
}

export const useCartStore = Object.assign(
  useCartStoreSelector,
  defaultCartStore,
);
