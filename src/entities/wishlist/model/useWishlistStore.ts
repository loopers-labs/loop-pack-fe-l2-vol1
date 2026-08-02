import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWebStorage } from '@/shared/lib/webStorage';
import { setReplacer, setReviver, toggleSetItem } from '@/shared/lib/set';

type WishlistState = { productIds: Set<string> };

type WishlistActions = {
  setSingleIdInWishlist: (productId: string) => void;
};

type WishlistStore = WishlistState & WishlistActions;

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      productIds: new Set<string>(),
      setSingleIdInWishlist: (productId: string) => {
        set((state) => ({
          productIds: toggleSetItem<string>(state.productIds, productId),
        }));
      },
    }),
    {
      name: 'WISH_LIST_STORE',
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
        return state as WishlistStore;
      },
      storage: createJSONStorage(() => createWebStorage('sessionStorage'), {
        replacer: setReplacer,
        reviver: setReviver,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('위시리스트 저장값이 손상되어 초기화합니다.', error);
          useWishlistStore.persist.clearStorage();
        }
      },
    },
  ),
);
