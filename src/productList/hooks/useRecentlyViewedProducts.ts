import { useEffect, useState } from "react";
import { readNumberListFromStorage, writeNumberListToStorage } from "../utils/storage";

const RECENTLY_VIEWED_KEY = "recentlyViewed";
const MAX_RECENTLY_VIEWED_COUNT = 10;

export function useRecentlyViewedProducts() {
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() =>
    readNumberListFromStorage(RECENTLY_VIEWED_KEY),
  );

  const addRecentlyViewedProduct = (productId: number) => {
    setRecentlyViewed((prev) => {
      const withoutCurrentProduct = prev.filter((id) => id !== productId);
      return [productId, ...withoutCurrentProduct].slice(0, MAX_RECENTLY_VIEWED_COUNT);
    });
  };

  useEffect(() => {
    writeNumberListToStorage(RECENTLY_VIEWED_KEY, recentlyViewed);
  }, [recentlyViewed]);

  return { addRecentlyViewedProduct };
}
