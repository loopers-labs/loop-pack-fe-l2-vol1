import { createIdSetStore } from "@/shared/lib";

// 장바구니에 담긴 상품 id 집합. wishlist 와 변경 이유가 달라 독립 store(독립 저장 키).
export const useCartStore = createIdSetStore("cart-store");

export const useIsInCart = (productId: string) =>
  useCartStore((state) => state.ids.has(productId));
// 담긴 id 집합. 소비부는 렌더에서 [...ids] 로 배열화한다(Set 참조는 변경 시에만 새로 생겨 재렌더가 정확).
export const useCartIds = () => useCartStore((state) => state.ids);
export const useCartCount = () => useCartStore((state) => state.ids.size);
export const useCartHasHydrated = () =>
  useCartStore((state) => state.hasHydrated);
export const useToggleCart = () => useCartStore((state) => state.toggle);
export const useClearCart = () => useCartStore((state) => state.clear);
