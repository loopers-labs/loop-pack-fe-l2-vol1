import { createIdSetStore } from "@/shared/lib";

// 위시리스트에 담긴 상품 id 집합. cart 를 모르는 독립 store(독립 저장 키).
export const useWishlistStore = createIdSetStore("wishlist-store");

export const useIsWishlisted = (productId: string) =>
  useWishlistStore((state) => state.ids.has(productId));
export const useWishlistCount = () =>
  useWishlistStore((state) => state.ids.size);
export const useWishlistHasHydrated = () =>
  useWishlistStore((state) => state.hasHydrated);
export const useToggleWishlist = () =>
  useWishlistStore((state) => state.toggle);
export const useClearWishlist = () => useWishlistStore((state) => state.clear);
