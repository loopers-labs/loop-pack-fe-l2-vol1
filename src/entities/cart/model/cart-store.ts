import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  createValidatedStorage,
  useRestoreStore,
  useStoreRestored,
} from '@/shared/persisted-store';

export const CART_STORAGE_KEY = 'commerce-cart';

const CART_STORAGE_VERSION = 1;

type CartState = {
  productIds: string[];
  /** 액션은 바뀌지 않아 상태가 아니다. 한 객체로 묶어 훅 하나로 내준다 */
  actions: {
    toggle: (productId: string) => void;
  };
};

type PersistedCart = Pick<CartState, 'productIds'>;

const EMPTY_PERSISTED_CART: PersistedCart = { productIds: [] };

/**
 * 유효한 상품 ID만 남긴다.
 */
const toValidProductIds = (value: unknown) =>
  Array.isArray(value) &&
  value.every((id) => typeof id === 'string' && id !== '')
    ? [...new Set<string>(value)]
    : [];

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      productIds: [],
      actions: {
        toggle: (productId) =>
          set((state) => ({
            productIds: state.productIds.includes(productId)
              ? state.productIds.filter((id) => id !== productId)
              : [...state.productIds, productId],
          })),
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      storage: createValidatedStorage((stored) => ({
        productIds: toValidProductIds(stored?.productIds),
      })),
      skipHydration: true,
      partialize: ({ productIds }) => ({ productIds }),
      /**
       * 저장된 version이 CART_STORAGE_VERSION과 다를 때만 호출되고, 반환값이 곧 복원될 상태가 된다.
       * 저장값은 코드보다 오래 살아남으므로, 담는 형태를 바꿀 때마다 version을 올리고
       * 여기에 이전 버전을 새 형태로 옮기는 코드를 넣어야 한다. 예를 들어 수량이 붙어 1 -> 2로 올린다면
       * `if (version === 1) return { items: persisted.productIds.map((id) => ({ id, quantity: 1 })) }` 처럼 쓴다.
       * 지금은 옮겨올 이전 형태가 없어 알 수 없는 버전을 버리기만 한다.
       */
      migrate: () => EMPTY_PERSISTED_CART,
    },
  ),
);

export const useRestoreCart = () => useRestoreStore(useCartStore);

/**
 * 담긴 상품을 selector로 구독한다.
 * 복원 전에는 undefined를 준다. 호출부는 이걸로 복원 대기 상태를 구분한다.
 */
export const useCart = <T>(
  select: (cart: Omit<CartState, 'actions'>) => T,
): T | undefined => {
  const restored = useStoreRestored(useCartStore);

  return useCartStore((state) => (restored ? select(state) : undefined));
};

/** 액션은 복원 여부와 무관하므로 복원 게이트를 거치지 않는다 */
export const useCartActions = () => useCartStore((state) => state.actions);
