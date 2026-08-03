import { create } from 'zustand';

interface WishlistState {
  ids: Set<string>;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),

  toggle: (id) =>
    set((state) => {
      const next = new Set(state.ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ids: next };
    }),

  has: (id) => get().ids.has(id),
}));
