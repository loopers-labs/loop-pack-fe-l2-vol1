import { createIdSetStore } from "@/shared/lib";

// 장바구니에 담긴 상품 id 집합. wishlist 와 변경 이유가 달라 독립 store(독립 저장 키).
export const useCartStore = createIdSetStore("cart-store");

export const useIsInCart = (productId: string) =>
  useCartStore((state) => state.ids.has(productId));
export const useCartCount = () => useCartStore((state) => state.ids.size);
export const useCartHasHydrated = () =>
  useCartStore((state) => state.hasHydrated);
export const useToggleCart = () => useCartStore((state) => state.toggle);
