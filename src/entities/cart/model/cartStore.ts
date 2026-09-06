import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { mergeCartItems } from './cartItems';
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
            const items = mergeCartItems(state.items, [{ id, quantity: 1 }]);
            return { items, lastAddedId: id };
          });
        },

        mergeItems: (items) =>
          set((state) => ({ items: mergeCartItems(state.items, items) })),

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
            const pendingItems = pendingItemIds.map((id) => ({
              id,
              quantity: 1,
            }));
            const items = mergeCartItems(state.items, pendingItems);

            const lastAddedId = pendingItemIds.at(-1) ?? state.lastAddedId;
            pendingItemIds.length = 0;

            return { items, lastAddedId, isHydrated: true };
          }),
      }),
      cartPersistence.createOptions(ownerKey),
    ),
  );
}

export type CartStore = ReturnType<typeof createCartStore>;
