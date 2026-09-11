import { selectAddCartItem, selectCartHasHydrated, useCartStore } from "@/entities/cart";
import { trackCartAdd } from "@/analytics/commerceEvents";

export function useAddToCart(productId: string) {
  const hasHydrated = useCartStore(selectCartHasHydrated);
  const addCartItem = useCartStore(selectAddCartItem);

  return {
    disabled: !hasHydrated,
    onClick: () => {
      const previousQuantity = useCartStore.getState().cartProductQuantityMap[productId] ?? 0;

      addCartItem(productId);
      trackCartAdd({
        productId,
        quantity: previousQuantity + 1,
      });
    },
  };
}
