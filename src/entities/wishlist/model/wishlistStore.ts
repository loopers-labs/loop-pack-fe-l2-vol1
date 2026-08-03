import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type WishlistStore = {
  items: string[];
  toggleItem: (id: string) => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      items: [],
      toggleItem: (id) =>
        set((state) => ({
          items: state.items.includes(id)
            ? state.items.filter((item) => item !== id)
            : [...state.items, id],
        })),
    }),
    {
      name: 'wishlist',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<WishlistStore>;
        if (version === 0 || !Array.isArray(state.items)) {
          return { items: [] };
        }
        return state as WishlistStore;
      },
      skipHydration: true,
    },
  ),
);
