'use client';

// [AI] 위시리스트 클라이언트 상태. 서버 저장소가 없으므로 zustand + persist(localStorage)로 관리.
// hasHydrated 플래그로 SSR/CSR hydration mismatch를 막고, selector는 원시값만 반환해 불필요 리렌더를 줄인다.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { migrateStoredItems } from '@/features/store-product/store/migrate';

// [AI] 헤더 카운트와 위시리스트 페이지 렌더에 필요한 최소 메타만 저장.
// Product 객체 전체를 넣으면 서버 데이터가 바뀌었을 때 스토어가 낡은 정보를 갖게 되므로 ID+표시용 메타로 좁힌다.
export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type WishlistState = {
  items: WishlistItem[];
  hasHydrated: boolean;
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  // TODO: setHasHydrated 로직 확인하기
  setHasHydrated: (hydrated: boolean) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((existing) => existing.id === item.id);
          return {
            items: exists
              ? state.items.filter((existing) => existing.id !== item.id)
              : [...state.items, item],
          };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clear: () => set({ items: [] }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'loopers-wishlist-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // [AI] persist는 클라이언트에서 비동기로 hydration을 수행한다.
      // rehydrate 완료 시점에 플래그를 켜야 서버 렌더(항상 0)와 충돌하지 않는다.
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // [AI] 저장값 복구 전략: persisted version과 version이 다를 때 migrate가 실행된다.
      // items를 필드별로 검증해 통과한 항목만 남겨 변조/옛날 스키마를 현재 스키마로 변환한다.
      migrate: migrateStoredItems,
    }
  )
);

// [AI] 원시값(number/boolean)을 반환하는 selector 훅.
// 객체/배열을 반환하지 않으므로 useShallow 없이도 안전하다.
export const useWishlistCount = (): number => useWishlistStore((state) => state.items.length);

export const useIsInWishlist = (id: string): boolean =>
  useWishlistStore((state) => state.items.some((item) => item.id === id));

export const useWishlistHasHydrated = (): boolean => useWishlistStore((state) => state.hasHydrated);
