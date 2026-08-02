import { create } from "zustand";

type CartState = {
  cartIds: Set<string>;
  toggleCart: (id: string) => void;
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

export const useCartStore = create<CartState>((set) => ({
  cartIds: new Set(),
  toggleCart: (id) => set((state) => ({ cartIds: toggleId(state.cartIds, id) })),
}));
