import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartPersistence } from './cartPersistence';
import type { CartState } from './cartTypes';
import type { CartOwnerKey } from './cartOwner';

export function createCartStore(ownerKey: CartOwnerKey) {
  const pendingItemIds: string[] = [];

  return createStore<CartState>()(
    persist(
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
      cartPersistence.createOptions(ownerKey),
    ),
  );
}

export type CartStore = ReturnType<typeof createCartStore>;
