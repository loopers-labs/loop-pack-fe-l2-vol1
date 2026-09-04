import { create } from 'zustand';

type CartState = {
  cart: string[];
  toggleCart: (id: string) => void;
};

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

// 앱의 공개 API는 여전히 index의 선택자 훅뿐이다 — 화면 코드는 이 모듈을 직접 import하지 않는다.
// 스토어 자체를 내보내는 건 테스트 때문이다: create()가 만든 상태는 모듈 전역이라
// 테스트 간에 그대로 새어 나가고, 리셋 경로가 없으면 실행 순서에 따라 결과가 달라진다.
// 테스트는 이 경로를 직접 import해 setState로 초기 상태를 세운다.
export const useCartStore = create<CartState>((set) => ({
  cart: [],
  toggleCart: (id) => set((state) => ({ cart: toggle(state.cart, id) })),
}));

// 개수는 저장하지 않고 length로 파생 — 헤더는 이것만 구독.
export const useCartCount = () => useCartStore((state) => state.cart.length);
export const useIsInCart = (id: string) =>
  useCartStore((state) => state.cart.includes(id));
export const useToggleCart = () => useCartStore((state) => state.toggleCart);
