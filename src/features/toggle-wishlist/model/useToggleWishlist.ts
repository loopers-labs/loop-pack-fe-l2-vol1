import {
  selectIsProductInWishlist,
  selectToggleWishlist,
  selectWishlistHasHydrated,
  useWishlistStore,
} from "@/entities/wishlist";
import { trackWishlistAdd } from "@/analytics/commerceEvents";

export function useToggleWishlist(productId: string) {
  const hasHydrated = useWishlistStore(selectWishlistHasHydrated);
  const isInWishlist = useWishlistStore(selectIsProductInWishlist(productId));
  const toggleWishlist = useWishlistStore(selectToggleWishlist);

  return {
    isPressed: hasHydrated ? isInWishlist : false,
    disabled: !hasHydrated,
    onClick: () => {
      toggleWishlist(productId);

      if (!isInWishlist) {
        trackWishlistAdd({ productId });
      }
    },
  };
}
