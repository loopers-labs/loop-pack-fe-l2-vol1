'use client';

// [AI] 장바구니 클라이언트 상태. 서버 저장소가 없으므로 zustand + persist(localStorage)로 관리.
// hasHydrated 플래그로 SSR/CSR hydration mismatch를 막고, selector는 원시값만 반환해 불필요 리렌더를 준다.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { CartItem } from '@/types/commerce';
import { migrateStoredItems } from '@/lib/storedItem';

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  toggle: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  setHasHydrated: (hydrated: boolean) => void;
};

export const useCartStore = create<CartState>()(
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
      name: 'loopers-cart-v1',
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
export const useCartCount = (): number => useCartStore((state) => state.items.length);

export const useIsInCart = (id: string): boolean =>
  useCartStore((state) => state.items.some((item) => item.id === id));

export const useCartHasHydrated = (): boolean => useCartStore((state) => state.hasHydrated);
