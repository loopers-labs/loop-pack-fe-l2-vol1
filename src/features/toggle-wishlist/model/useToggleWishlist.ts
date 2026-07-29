import { selectIsProductInWishlist, selectToggleWishlist } from "@/entities/wishlist";
import { useCommerceStore } from "@/_app/model/commerceStore";

export function useToggleWishlist(productId: string) {
  const hasHydrated = useCommerceStore((state) => state.hasHydrated);
  const isInWishlist = useCommerceStore(selectIsProductInWishlist(productId));
  const toggleWishlist = useCommerceStore(selectToggleWishlist);

  return {
    isPressed: hasHydrated ? isInWishlist : false,
    disabled: !hasHydrated,
    onClick: () => toggleWishlist(productId),
  };
}
