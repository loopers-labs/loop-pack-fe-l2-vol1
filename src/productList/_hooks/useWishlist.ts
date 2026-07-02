import { useState, useEffect } from 'react';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // wishlist가 바뀔 때마다 localStorage 동기화 (브라우저 외부 시스템)
  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [wishlist]);

  const handleWishlistToggle = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  return { wishlist, handleWishlistToggle };
}
