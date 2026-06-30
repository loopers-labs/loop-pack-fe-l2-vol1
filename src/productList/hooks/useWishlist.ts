import { useEffect, useState } from "react";

const WISHLIST_STORAGE_KEY = "wishlist";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
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
