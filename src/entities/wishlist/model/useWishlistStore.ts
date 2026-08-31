import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { toggleWishlistItem } from './toggleWishlistItem';

/**
 * 비로그인 사용자의 로컬 위시리스트.
 *
 * cart 와 자료구조가 같지만 별개 도메인이라 store 를 나눈다.
 * toggle 규칙도 shared 로 빼지 않고 각자 갖는다. 공유하면 이 슬라이스를
 * 통째로 지울 때 shared 에 주인 없는 헬퍼가 남는다.
 */
interface UseWishlistStoreState {
  wishlist: string[];
}

interface UseWishlistStoreActions {
  toggleWishlist: (productId: string) => void;
}

export const useWishlistStore = create<UseWishlistStoreState & UseWishlistStoreActions>()(
  persist(
    (set) => ({
      wishlist: [],
      toggleWishlist: (productId) => set((state) => ({ wishlist: toggleWishlistItem(state.wishlist, productId) })),
    }),
    {
      name: 'commerce-wishlist',
    },
  ),
);
