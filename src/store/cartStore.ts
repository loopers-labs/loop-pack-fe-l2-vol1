import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: Map<string, CartItem>;
  lastAddedItem: Omit<CartItem, 'quantity'> | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  clearLastAdded: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: new Map(),
  lastAddedItem: null,

  addItem: (item) =>
    set((state) => {
      const next = new Map(state.items);
      const existing = next.get(item.id);
      next.set(item.id, {
        ...item,
        quantity: existing ? existing.quantity + 1 : 1,
      });
      return { items: next, lastAddedItem: item };
    }),

  removeItem: (id) =>
    set((state) => {
      const next = new Map(state.items);
      next.delete(id);
      return { items: next };
    }),

  clearLastAdded: () => set({ lastAddedItem: null }),
}));
