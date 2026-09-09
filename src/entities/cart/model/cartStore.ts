import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItemDetails = {
  name: string;
  brand: string;
  price: number;
  image: string;
};

const STORE_VERSION = 2;

type CartStore = {
  items: string[];
  // 상품을 id로 다시 조회하는 API가 없어, 담는 시점에 이미 가진 정보를
  // 같이 저장해둔다. items 자체의 모양(문자열 배열)은 그대로 둬서 기존
  // 코드(Header의 개수 파생, ProductCard의 isInCart 판정 등)에 영향이 없다.
  itemDetails: Record<string, CartItemDetails>;
  addItem: (id: string, details?: CartItemDetails) => void;
  removeItem: (id: string) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      itemDetails: {},
      addItem: (id, details) =>
        set((state) => ({
          items: state.items.includes(id) ? state.items : [...state.items, id],
          itemDetails: details
            ? { ...state.itemDetails, [id]: details }
            : state.itemDetails,
        })),
      // itemDetails는 지우지 않는다 — 주문내역이 이 캐시로 과거에 주문한
      // 상품의 이름·이미지를 보여준다(주문 API 응답엔 productId만 있음).
      // 상품이 30개뿐이라 계속 남겨둬도 용량 부담이 없다. 다만 "그때 가격"이
      // 아니라 "가장 최근에 담겼을 때의 정보"만 남는다는 트레이드오프가 있다.
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item !== id),
        })),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => localStorage),
      version: STORE_VERSION,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<CartStore>;
        if (version < STORE_VERSION || !Array.isArray(state.items)) {
          return {
            items: Array.isArray(state.items) ? state.items : [],
            itemDetails: {},
          };
        }
        return state as CartStore;
      },
      skipHydration: true,
    },
  ),
);
