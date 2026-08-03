import { create } from 'zustand';

interface CartItem {
  id: string;
  quantity: number;
}

interface CartState {
  items: Map<string, CartItem>;
  lastAddedId: string | null;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearLastAdded: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: new Map(),
  lastAddedId: null,

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

  clearLastAdded: () => set({ lastAddedId: null }),
}));
