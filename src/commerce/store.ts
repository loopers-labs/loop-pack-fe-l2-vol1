import { create } from "zustand";

interface CommerceState {
  cartIds: Set<string>;
  wishlistIds: Set<string>;
  toggleCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
}

function toggleId(ids: Set<string>, id: string): Set<string> {
  const next = new Set(ids);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export const useCommerceStore = create<CommerceState>((set) => ({
  cartIds: new Set(),
  wishlistIds: new Set(),
  toggleCart: (id) => set((state) => ({ cartIds: toggleId(state.cartIds, id) })),
  toggleWishlist: (id) => set((state) => ({ wishlistIds: toggleId(state.wishlistIds, id) })),
}));
