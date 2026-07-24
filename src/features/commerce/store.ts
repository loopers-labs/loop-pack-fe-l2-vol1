"use client";
import { create } from "zustand";

// 담긴 상품은 "id 집합"만 저장한다. 서버가 소유한 상품 상세를 여기에 복사하지 않는다.
type CollectionState = {
  cart: Record<string, true>;
  wishlist: Record<string, true>;
  toggleCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
};

// 있으면 빼고 없으면 넣는다 — 원본을 건드리지 않고 새 객체를 만든다.
const toggle = (collection: Record<string, true>, id: string): Record<string, true> => {
  const { [id]: existing, ...rest } = collection;
  return existing === true ? rest : { ...collection, [id]: true };
};

export const useCollectionStore = create<CollectionState>()((set) => ({
  cart: {},
  wishlist: {},
  toggleCart: (id) => set((state) => ({ cart: toggle(state.cart, id) })),
  toggleWishlist: (id) => set((state) => ({ wishlist: toggle(state.wishlist, id) })),
}));

// selector — 컴포넌트는 필요한 값/action만 구독한다.
// 개수는 저장하지 않고 파생(계산): 담긴 id 수에서 뽑는다.
export const useCartCount = () => useCollectionStore((state) => Object.keys(state.cart).length);
export const useWishlistCount = () =>
  useCollectionStore((state) => Object.keys(state.wishlist).length);
export const useIsInCart = (id: string) => useCollectionStore((state) => state.cart[id] === true);
export const useIsInWishlist = (id: string) =>
  useCollectionStore((state) => state.wishlist[id] === true);
export const useToggleCart = () => useCollectionStore((state) => state.toggleCart);
export const useToggleWishlist = () => useCollectionStore((state) => state.toggleWishlist);
