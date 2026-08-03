import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 비로그인 사용자의 로컬 장바구니.
 *
 * 담긴 상품 "집합"만 저장한다. 개수는 length 에서 파생하므로 따로 두지 않는다.
 */
interface UseCartStoreState {
  cart: string[];
}

interface UseCartStoreActions {
  toggleCart: (productId: string) => void;
}

const toggle = (list: string[], id: string): string[] =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

export const useCartStore = create<UseCartStoreState & UseCartStoreActions>()(
  persist(
    (set) => ({
      cart: [],
      toggleCart: (productId) => set((state) => ({ cart: toggle(state.cart, productId) })),
    }),
    {
      name: 'commerce-cart',
    },
  ),
);
