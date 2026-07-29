import type { StateCreator } from "zustand";
import { normalizeIdSet } from "@/shared/lib/id-set/idSet";
import type { IdSet } from "@/shared/lib/id-set/idSet";

export type CartSlice = {
  cartProductIdMap: IdSet;
  toggleCart: (productId: string) => void;
};

export function createCartSlice<Store extends CartSlice>(): StateCreator<Store, [], [], CartSlice> {
  return (set) => ({
    cartProductIdMap: {},
    toggleCart: (productId) => {
      set((state) => {
        const cartProductIdMap = normalizeIdSet(state.cartProductIdMap);

        if (cartProductIdMap[productId] === true) {
          const { [productId]: _removed, ...nextCartProductIdMap } = cartProductIdMap;

          return { cartProductIdMap: nextCartProductIdMap } as Partial<Store>;
        }

        return { cartProductIdMap: { ...cartProductIdMap, [productId]: true } } as Partial<Store>;
      });
    },
  });
}
