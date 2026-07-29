import { selectIsProductInCart, selectToggleCart } from "@/entities/cart";
import { useCommerceStore } from "@/_app/model/commerceStore";

export function useAddToCart(productId: string) {
  const hasHydrated = useCommerceStore((state) => state.hasHydrated);
  const isInCart = useCommerceStore(selectIsProductInCart(productId));
  const toggleCart = useCommerceStore(selectToggleCart);

  return {
    isPressed: hasHydrated ? isInCart : false,
    disabled: !hasHydrated,
    onClick: () => toggleCart(productId),
  };
}
