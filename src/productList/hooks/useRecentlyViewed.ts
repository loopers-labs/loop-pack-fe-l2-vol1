import { useLocalStorageState } from "./useLocalStorageState";

const MAX_RECENT = 10;

// 최근 본 상품 id를 최신순으로 최대 10개 보관하고 localStorage와 동기화한다.
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorageState("recentlyViewed");

  const add = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, MAX_RECENT);
    });
  };

  return { recentlyViewed, add };
}
