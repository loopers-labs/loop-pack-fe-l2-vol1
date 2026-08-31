import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  quantity: number;
}

interface CartState {
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

export const CART_STORAGE_KEY = 'aesthetic-cart';

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

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], CartPersistedState>((set) => ({
  items: new Map(),
  lastAddedId: null,
  isHydrated: false,

  addItem: (id) =>
    set((state) => {
      const next = new Map(state.items);
      const existing = next.get(id);
      next.set(id, { id, quantity: existing ? existing.quantity + 1 : 1 });
      return { items: next, lastAddedId: id };
    }),

  removeItem: (id) =>
    set((state) => {
      const next = new Map(state.items);
      next.delete(id);
      return { items: next };
    }),

  clearItems: () => set({ items: new Map(), lastAddedId: null }),
  clearLastAdded: () => set({ lastAddedId: null }),
  setHydrated: () => set({ isHydrated: true }),
}), {
  name: CART_STORAGE_KEY,
  version: 1,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: (state) => ({ items: Array.from(state.items.values()) }),
  merge: (persistedState, currentState) => ({
    ...currentState,
    items: parsePersistedItems(persistedState),
  }),
  migrate: () => ({ items: [] }),
}),
);
