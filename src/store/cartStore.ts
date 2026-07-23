import { create } from 'zustand';

type CartStore = {
  items: string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (id) =>
    set((state) => ({
      items: state.items.includes(id) ? state.items : [...state.items, id],
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item !== id),
    })),
}));
