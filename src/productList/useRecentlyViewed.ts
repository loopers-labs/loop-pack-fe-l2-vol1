import { useEffect, useState } from "react";
import { addRecentId } from "./listOps";

const STORAGE_KEY = "recentlyViewed";

/** 최근 본 상품 목록을 localStorage(`"recentlyViewed"`)와 동기화하는 훅. */
export function useRecentlyViewed() {
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

  const add = (id: number) => {
    setRecentlyViewed((prev) => addRecentId(prev, id));
  };

  return { recentlyViewed, add };
}
