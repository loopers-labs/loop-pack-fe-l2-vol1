import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type CartStore = {
  items: string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (id) =>
        set((state) => ({
          items: state.items.includes(id) ? state.items : [...state.items, id],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item !== id),
        })),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<CartStore>;
        if (version === 0 || !Array.isArray(state.items)) {
          return { items: [] };
        }
        return state as CartStore;
      },
      skipHydration: true,
    },
  ),
);
