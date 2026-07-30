import {
  selectCartHasHydrated,
  selectIsProductInCart,
  selectToggleCart,
  useCartStore,
} from "@/entities/cart";

export function useAddToCart(productId: string) {
  const hasHydrated = useCartStore(selectCartHasHydrated);
  const isInCart = useCartStore(selectIsProductInCart(productId));
  const toggleCart = useCartStore(selectToggleCart);

  return {
    isPressed: hasHydrated ? isInCart : false,
    disabled: !hasHydrated,
    onClick: () => toggleCart(productId),
  };
}
