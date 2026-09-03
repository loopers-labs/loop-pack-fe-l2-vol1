import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { toggleCartItem } from './toggleCartItem';

/**
 * 비로그인 사용자의 로컬 장바구니.
 *
 * 담긴 상품 "집합"만 저장한다. 개수는 length 에서 파생하므로 따로 두지 않는다.
 * 넣고 빼는 규칙 자체는 `toggleCartItem` 이 갖는다 — store 는 그 규칙을 저장에 배선할 뿐이다.
 */
interface UseCartStoreState {
  cart: string[];
}

interface UseCartStoreActions {
  toggleCart: (productId: string) => void;
}

export const useCartStore = create<UseCartStoreState & UseCartStoreActions>()(
  persist(
    (set) => ({
      cart: [],
      toggleCart: (productId) => set((state) => ({ cart: toggleCartItem(state.cart, productId) })),
    }),
    {
      name: 'commerce-cart',
    },
  ),
);
