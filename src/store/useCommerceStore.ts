import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 비로그인 사용자의 로컬 장바구니,위시리스트
 */
interface UseCommerceStoreState {
  cart: string[];
  wishlist: string[];
}

interface UseCommerceStoreActions {
  toggleCart: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
}

const toggle = (list: string[], id: string): string[] =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

export const useCommerceStore = create<UseCommerceStoreState & UseCommerceStoreActions>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      toggleCart: (productId) => set((state) => ({ cart: toggle(state.cart, productId) })),
      toggleWishlist: (productId) => set((state) => ({ wishlist: toggle(state.wishlist, productId) })),
    }),
    {
      name: 'commerce-store',
    },
  ),
);
