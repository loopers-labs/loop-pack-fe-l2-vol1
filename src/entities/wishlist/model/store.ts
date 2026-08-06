import { create } from 'zustand';

type WishlistState = {
  wishlist: string[];
  toggleWish: (id: string) => void;
};

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

// 스토어는 슬라이스 밖으로 내보내지 않는다 — 외부는 index의 선택자 훅만 쓴다.
const useWishlistStore = create<WishlistState>((set) => ({
  wishlist: [],
  toggleWish: (id) =>
    set((state) => ({ wishlist: toggle(state.wishlist, id) })),
}));

// 개수는 저장하지 않고 length로 파생 — 헤더는 이것만 구독.
export const useWishCount = () =>
  useWishlistStore((state) => state.wishlist.length);
export const useIsWished = (id: string) =>
  useWishlistStore((state) => state.wishlist.includes(id));
export const useToggleWish = () =>
  useWishlistStore((state) => state.toggleWish);
