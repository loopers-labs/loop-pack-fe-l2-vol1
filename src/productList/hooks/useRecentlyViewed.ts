import { useState, useEffect } from 'react';

const RECENTLY_VIEWED_MAX = 10;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('recentlyViewed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, RECENTLY_VIEWED_MAX);
    });
  };

  return { recentlyViewed, addRecentlyViewed };
}
