import { create } from "zustand";

type WishlistState = {
  wishlistIds: Set<string>;
  toggleWishlist: (id: string) => void;
};

const toggleId = (ids: Set<string>, id: string): Set<string> => {
  const next = new Set(ids);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
};

export const useWishlistStore = create<WishlistState>((set) => ({
  wishlistIds: new Set(),
  toggleWishlist: (id) => set((state) => ({ wishlistIds: toggleId(state.wishlistIds, id) })),
}));
