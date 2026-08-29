import { selectAddCartItem, selectCartHasHydrated, useCartStore } from "@/entities/cart";

export function useAddToCart(productId: string) {
  const hasHydrated = useCartStore(selectCartHasHydrated);
  const addCartItem = useCartStore(selectAddCartItem);

  return {
    disabled: !hasHydrated,
    onClick: () => addCartItem(productId),
  };
}
