import { useEffect, useState } from "react";
import { readNumberListFromStorage, writeNumberListToStorage } from "../utils/storage";

const WISHLIST_STORAGE_KEY = "wishlist";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>(() =>
    readNumberListFromStorage(WISHLIST_STORAGE_KEY),
  );

  useEffect(() => {
    writeNumberListToStorage(WISHLIST_STORAGE_KEY, wishlist);
  }, [wishlist]);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const isWishlisted = (productId: number) => {
    return wishlist.includes(productId);
  };

  return {
    wishlistCount: wishlist.length,
    toggleWishlist,
    isWishlisted,
  };
}
