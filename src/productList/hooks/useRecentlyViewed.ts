import { useEffect, useState } from 'react';

const STORAGE_KEY = 'recentlyViewed';

//매직넘버 제거를 위해 상수로 선언하였습니다.
const MAX_RECENTLY_VIEWED = 10;

/**
 * 최근 본 상품 목록을 localStorage와 동기화하며 관리하는 훅
 * - 분리 기준: 같은 데이터를 다루는 로직은 한 곳에 모아두었습니다.
 *   localStorage 동기화가 useWishlist와 중복되지만 아직 2회 반복이라 공통 훅 추출은 보류하였습니다.
 */
export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = (productId: number) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED));
  };

  return { recentlyViewed, addRecentlyViewed };
};
