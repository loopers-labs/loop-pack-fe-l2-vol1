import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wishlist';

/**
 * 위시리스트를 localStorage와 동기화하며 관리하는 훅
 * - 분리 기준: 같은 데이터를 다루는 로직은 한 곳에 모아두었습니다.
 *   localStorage 동기화가 useRecentlyViewed와 중복되지만 아직 2회 반복이라 공통 훅 추출은 보류하였습니다.
 */
export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [wishlist]);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  return { wishlist, toggleWishlist };
};
