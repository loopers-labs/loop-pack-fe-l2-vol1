import { create } from 'zustand';

type ShopState = {
  cart: string[];
  wishlist: string[];
  toggleCart: (id: string) => void;
  toggleWish: (id: string) => void;
};

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

// 스토어는 파일 밖으로 내보내지 않는다 — 아무도 store 전체를 구독하지 못하게.
const useShopStore = create<ShopState>((set) => ({
  cart: [],
  wishlist: [],
  toggleCart: (id) => set((state) => ({ cart: toggle(state.cart, id) })),
  toggleWish: (id) =>
    set((state) => ({ wishlist: toggle(state.wishlist, id) })),
}));

// 개수는 저장하지 않고 length로 파생 — 헤더는 이것만 구독.
export const useCartCount = () => useShopStore((state) => state.cart.length);
export const useWishCount = () =>
  useShopStore((state) => state.wishlist.length);

// 상품 버튼은 해당 상품의 포함 여부 + 필요한 action만 구독.
export const useIsInCart = (id: string) =>
  useShopStore((state) => state.cart.includes(id));
export const useIsWished = (id: string) =>
  useShopStore((state) => state.wishlist.includes(id));
export const useToggleCart = () => useShopStore((state) => state.toggleCart);
export const useToggleWish = () => useShopStore((state) => state.toggleWish);
