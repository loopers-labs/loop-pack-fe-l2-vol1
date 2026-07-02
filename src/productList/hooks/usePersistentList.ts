import { useEffect, useState } from "react";

export const usePersistentList = () => {
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem("wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem("recentlyViewed");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ─── 위시리스트가 바뀔 때마다 localStorage 동기화 ───────
  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [recentlyViewed]);

  const handleWishlistToggle = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleProductClick = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, 10);
    });
  };

  return { wishlist, recentlyViewed, handleWishlistToggle, handleProductClick };
};

export type PersistentListController = ReturnType<typeof usePersistentList>;
