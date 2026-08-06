import { create } from 'zustand';

type CartState = {
  cart: string[];
  toggleCart: (id: string) => void;
};

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

// 스토어는 슬라이스 밖으로 내보내지 않는다 — 외부는 index의 선택자 훅만 쓴다.
const useCartStore = create<CartState>((set) => ({
  cart: [],
  toggleCart: (id) => set((state) => ({ cart: toggle(state.cart, id) })),
}));

// 개수는 저장하지 않고 length로 파생 — 헤더는 이것만 구독.
export const useCartCount = () => useCartStore((state) => state.cart.length);
export const useIsInCart = (id: string) =>
  useCartStore((state) => state.cart.includes(id));
export const useToggleCart = () => useCartStore((state) => state.toggleCart);
