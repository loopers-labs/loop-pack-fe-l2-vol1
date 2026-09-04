import { useCartStore } from "@/entities/cart/model/cartStore";
import { useHasHydrated, useRehydrate } from "@/shared/lib/persist/hydration";

// 개수는 저장하지 않고 id 배열 길이로 파생한다. number라 참조가 안정적이라 useShallow가 필요 없다.
export function useCartCount() {
  return useCartStore((state) => state.cartIds.length);
}

// 주문서가 담은 상품 id 목록을 읽는다. 배열이라 store가 바뀌면 리렌더된다(주문서는 라이브 cart를 보여준다).
export function useCartIds() {
  return useCartStore((state) => state.cartIds);
}

// 카드는 자기 상품의 포함 여부만 구독한다. 다른 상품이 담겨도 이 값이 안 바뀌면 리렌더되지 않는다.
export function useIsInCart(productId: string) {
  return useCartStore((state) => state.cartIds.includes(productId));
}

export function useAddToCart() {
  return useCartStore((state) => state.addToCart);
}

export function useRemoveFromCart() {
  return useCartStore((state) => state.removeFromCart);
}

export function useClearCart() {
  return useCartStore((state) => state.clearCart);
}

// 복원 여부·복원 트리거는 도메인 무지 배관을 cart store로 감싸 공개한다(store 인스턴스는 숨김).
export function useCartHydrated() {
  return useHasHydrated(useCartStore);
}

export function useHydrateCart() {
  useRehydrate(useCartStore);
}
