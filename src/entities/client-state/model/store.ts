import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

import {
  createCartSlice,
  type CartSlice,
} from '@/entities/cart/@x/client-state';
import {
  createWishlistSlice,
  type WishlistSlice,
} from '@/entities/wishlist/@x/client-state';

type BoundState = CartSlice & WishlistSlice;
type PersistedState = Pick<BoundState, 'cartProductIds' | 'wishlistProductIds'>;

export const STORAGE_KEY = 'commerce-client-state';

const STORAGE_VERSION = 1;

/** persist는 version이 숫자일 때만 비교하므로, 숫자가 아니면 절대 일치하지 않는 값으로 바꿔 폐기로 보낸다 */
const UNKNOWN_VERSION = -1;

const EMPTY_PERSISTED_STATE: PersistedState = {
  cartProductIds: [],
  wishlistProductIds: [],
};

const isProductIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((id) => typeof id === 'string' && id !== '');

/**
 * 유효한 상품 ID만 남긴다.
 */
const toValidProductIds = (value: unknown) =>
  isProductIds(value) ? [...new Set(value)] : [];

const removeStored = (name: string) => {
  try {
    localStorage.removeItem(name);
  } catch {
    // 저장소 접근이 막힌 브라우저에서는 지울 수도 없어 스킵.
  }
};

/**
 * JSON.parse를 검증하고 파싱 결과를 검사해서 사용하도록 스토리지 구성
 */
const validatedStorage: PersistStorage<PersistedState> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);

      if (raw === null) return null;

      const { state, version } = JSON.parse(raw);

      return {
        state: {
          cartProductIds: toValidProductIds(state?.cartProductIds),
          wishlistProductIds: toValidProductIds(state?.wishlistProductIds),
        },
        version: typeof version === 'number' ? version : UNKNOWN_VERSION,
      };
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `저장된 클라이언트 상태를 읽지 못해 초기 상태로 시작합니다. (${name})`,
        );
      }
      removeStored(name);

      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // 실패해도 화면 동작을 막지 않음.
    }
  },
  removeItem: removeStored,
};

/**
 * 앱 전역 클라이언트 상태. 기능별 slice를 합쳐 하나의 store로 둔다.
 * 한 slice가 커져도 다른 slice를 건드리지 않고, slice끼리 상태를 읽어야 할 때도 같은 store를 본다.
 */
export const useBoundStore = create<BoundState>()(
  persist(
    (...args) => ({
      ...createCartSlice(...args),
      ...createWishlistSlice(...args),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: validatedStorage,
      skipHydration: true,
      partialize: ({ cartProductIds, wishlistProductIds }) => ({
        cartProductIds,
        wishlistProductIds,
      }),
      /**
       * 저장된 version이 STORAGE_VERSION과 다를 때만 호출되고, 반환값이 곧 복원될 상태가 된다.
       * 저장값은 코드보다 오래 살아남으므로, 형태를 바꿀 때마다 STORAGE_VERSION을 올리고
       * 여기에 이전 버전을 새 형태로 옮기는 코드를 넣어야 한다. 예를 들어 1 -> 2로 올린다면
       * `if (version === 1) return { cartItems: persisted.cartProductIds.map(...) }` 처럼 쓴다.
       * 지금은 persist를 처음 붙여 옮겨올 이전 형태가 없어, 알 수 없는 버전을 버리기만 한다.
       */
      migrate: () => EMPTY_PERSISTED_STATE,
    },
  ),
);

/**
 * 서버 HTML과 같은 빈 상태로 첫 렌더를 마친 뒤에 저장값을 읽는다.
 */
export const useRestoreSavedStore = () => {
  useEffect(() => {
    void useBoundStore.persist.rehydrate();
  }, []);
};

/**
 * persist store가 주는 값을 구독해 복원이 끝났는지 여부를 반환
 */
export const useRestored = () =>
  useSyncExternalStore(
    useBoundStore.persist.onFinishHydration,
    useBoundStore.persist.hasHydrated,
    () => false,
  );
