import { useWishlistStore } from "./model/store";

export { WishlistToggleButton } from "./ui/wishlist-toggle-button";

export const useWishlistCount = () => useWishlistStore((state) => state.wishlistIds.size);
