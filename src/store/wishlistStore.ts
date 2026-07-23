import { create } from 'zustand';

type WishlistStore = {
  items: string[];
  toggleItem: (id: string) => void;
};

export const useWishlistStore = create<WishlistStore>((set) => ({
  items: [],
  toggleItem: (id) =>
    set((state) => ({
      items: state.items.includes(id)
        ? state.items.filter((item) => item !== id)
        : [...state.items, id],
    })),
}));
