import { useLocalStorageState } from "./useLocalStorageState";

const MAX_RECENTLY_VIEWED = 10;

/** 최근 본 상품(상품 id 목록)을 최신순 최대 10개로 localStorage 에 영속한다. */
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorageState<number[]>(
    "recentlyViewed",
    [],
  );

  const addRecentlyViewed = (productId: number) => {
    setRecentlyViewed((prev) => {
      const withoutCurrent = prev.filter((id) => id !== productId);
      return [productId, ...withoutCurrent].slice(0, MAX_RECENTLY_VIEWED);
    });
  };

  return { recentlyViewed, addRecentlyViewed };
}
