'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  createValidatedStorage,
  useRestoreStore,
  useStoreRestored,
} from '@/shared/persisted-store';

export const WISHLIST_STORAGE_KEY = 'commerce-wishlist';

const WISHLIST_STORAGE_VERSION = 1;

type WishlistState = {
  productIds: string[];
  /** 액션은 바뀌지 않아 상태가 아니다. 한 객체로 묶어 훅 하나로 내준다 */
  actions: {
    toggle: (productId: string) => void;
  };
};

type PersistedWishlist = Pick<WishlistState, 'productIds'>;

const EMPTY_PERSISTED_WISHLIST: PersistedWishlist = { productIds: [] };

/**
 * 유효한 상품 ID만 남긴다.
 */
const toValidProductIds = (value: unknown) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === 'string' && id !== '',
          ),
        ),
      ]
    : [];

export const useWishlistStore = create<WishlistState>()(
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
      name: WISHLIST_STORAGE_KEY,
      version: WISHLIST_STORAGE_VERSION,
      storage: createValidatedStorage((stored) => ({
        productIds: toValidProductIds(stored?.productIds),
      })),
      skipHydration: true,
      partialize: ({ productIds }) => ({ productIds }),
      /** 형태를 바꿀 때 version을 올리고 이전 형태를 여기서 옮긴다. 지금은 옮겨올 게 없어 버리기만 한다 */
      migrate: () => EMPTY_PERSISTED_WISHLIST,
    },
  ),
);

export const useRestoreWishlist = () => useRestoreStore(useWishlistStore);

/**
 * 찜한 상품을 selector로 구독한다.
 * 복원 전에는 undefined를 준다. 호출부는 이걸로 복원 대기 상태를 구분한다.
 */
export const useWishlist = <T>(
  select: (wishlist: Omit<WishlistState, 'actions'>) => T,
): T | undefined => {
  const restored = useStoreRestored(useWishlistStore);

  return useWishlistStore((state) => (restored ? select(state) : undefined));
};

/** 액션은 복원 여부와 무관하므로 복원 게이트를 거치지 않는다 */
export const useWishlistActions = () =>
  useWishlistStore((state) => state.actions);
