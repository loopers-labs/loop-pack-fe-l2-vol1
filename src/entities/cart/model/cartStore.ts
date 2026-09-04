import { create } from 'zustand';

export type CartStore = {
  // productId → 수량(1 이상). 위시리스트와 달리 수량을 가지므로 ID Set 팩토리를 쓰지 않는다.
  // 수량을 바꾸는 자리는 장바구니 하나다 — 주문서는 확정된 품목을 읽기만 한다.
  items: Map<string, number>;
  toggle: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: new Map(),
  // 상품 카드의 '담기'는 토글이다. 새로 담을 때 수량은 1로 시작한다.
  toggle: (productId) =>
    set((state) => {
      const next = new Map(state.items);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.set(productId, 1);
      }

      return { items: next };
    }),
  // 서버가 주문을 받는 조건과 같은 기준으로 거른다(1 이상의 정수). 화면이 무엇을 보내든
  // 잘못된 수량이 장바구니에 남지 않게 여기서 막는다.
  setQuantity: (productId, quantity) =>
    set((state) => {
      if (!state.items.has(productId) || !Number.isSafeInteger(quantity) || quantity < 1) {
        return state;
      }

      return { items: new Map(state.items).set(productId, quantity) };
    }),
  remove: (productId) =>
    set((state) => {
      if (!state.items.has(productId)) {
        return state;
      }

      const next = new Map(state.items);
      next.delete(productId);
      return { items: next };
    })
}));
