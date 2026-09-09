import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWebStorage } from '@/shared/lib/webStorage';
import { setReplacer, setReviver, toggleSetItem } from '@/shared/lib/set';

type CartState = { productIds: Set<string> };

type CartActions = {
  setSingleIdInCart: (productId: string) => void;
  /** 담은 목록을 초기 상태로 되돌린다. 주문 완료와 로그아웃이 부른다 */
  clearCart: () => void;
};

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      productIds: new Set<string>(),
      setSingleIdInCart: (productId: string) => {
        set((state) => ({
          productIds: toggleSetItem<string>(state.productIds, productId),
        }));
      },
      clearCart: () => {
        set({ productIds: new Set<string>() });
      },
    }),
    {
      name: 'CART_STORE',
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { productIds?: unknown };
        if (version === 0) {
          const ids =
            state.productIds instanceof Set
              ? state.productIds
              : new Set<string>(Array.isArray(state.productIds) ? state.productIds : []);
          return { ...state, productIds: ids };
        }
        return state as CartStore;
      },
      storage: createJSONStorage(() => createWebStorage('sessionStorage'), {
        replacer: setReplacer,
        reviver: setReviver,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('장바구니 저장값이 손상되어 초기화합니다.', error);
          useCartStore.persist.clearStorage();
        }
      },
    },
  ),
);
