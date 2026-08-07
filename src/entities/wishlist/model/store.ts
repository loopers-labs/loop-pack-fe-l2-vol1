"use client";
import { create } from "zustand";
import { countIds, toggleId, type IdSet } from "@/shared/lib/idSet";

// cart와 같은 모양이지만 별도 슬라이스다 — "위시리스트를 통째로 제거한다면"에서
// 폴더 삭제로 끝나야 한다(한 store에 두면 파일을 열어 절반만 도려내야 한다).
type WishlistState = {
  items: IdSet;
  toggle: (id: string) => void;
};

const useWishlistStore = create<WishlistState>()((set) => ({
  items: {},
  toggle: (id) => set((state) => ({ items: toggleId(state.items, id) })),
}));

export const useWishlistCount = () => useWishlistStore((state) => countIds(state.items));
export const useIsInWishlist = (id: string) =>
  useWishlistStore((state) => state.items[id] === true);
export const useToggleWishlist = () => useWishlistStore((state) => state.toggle);
