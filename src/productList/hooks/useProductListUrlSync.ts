import { useEffect } from "react";
import type { CategoryFilter, SortBy } from "../types";

type UrlSyncState = {
  category: CategoryFilter;
  searchQuery: string;
  page: number;
  sortBy: SortBy;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
};

// 필터·검색·페이지 상태를 URL 쿼리스트링에 반영한다(외부 시스템 = 주소창 동기화).
export function useProductListUrlSync(state: UrlSyncState) {
  const { category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly } = state;

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") {
      params.set("category", category);
    }
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    if (sortBy !== "latest") {
      params.set("sort", sortBy);
    }
    if (minPrice !== "") {
      params.set("minPrice", String(minPrice));
    }
    if (maxPrice !== "") {
      params.set("maxPrice", String(maxPrice));
    }
    if (inStockOnly) {
      params.set("inStock", "true");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly]);
}
