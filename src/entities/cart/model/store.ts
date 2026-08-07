"use client";
import { create } from "zustand";
import { countIds, toggleId, type IdSet } from "@/shared/lib/idSet";

// 담긴 상품은 "id 집합"만 저장한다. 서버가 소유한 상품 상세를 여기에 복사하지 않는다.
type CartState = {
  items: IdSet;
  toggle: (id: string) => void;
};

// raw store는 밖으로 내보내지 않는다(index.ts 참조).
// 외부가 store 전체를 구독하면 아래 selector들이 만든 리렌더 경계가 무너진다.
const useCartStore = create<CartState>()((set) => ({
  items: {},
  toggle: (id) => set((state) => ({ items: toggleId(state.items, id) })),
}));

// 개수는 저장하지 않고 파생(계산)한다 — 담긴 id 수에서 뽑는다.
export const useCartCount = () => useCartStore((state) => countIds(state.items));
export const useIsInCart = (id: string) => useCartStore((state) => state.items[id] === true);
export const useToggleCart = () => useCartStore((state) => state.toggle);
