import { useStoredIds } from './useStoredIds';

const STORAGE_KEY = 'recentlyViewed';
const MAX_RECENT = 10;

export function useRecentlyViewed(): {
  recentlyViewed: number[];
  addRecentlyViewed: (productId: number) => void;
} {
  const [recentlyViewed, setRecentlyViewed] = useStoredIds(STORAGE_KEY);

  const addRecentlyViewed = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, MAX_RECENT);
    });
  };

  return { recentlyViewed, addRecentlyViewed };
}
