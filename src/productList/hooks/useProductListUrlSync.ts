import { useEffect } from "react";
import type { FilterState } from "../types";
import { buildFilterQuery } from "../utils/productListUrl";

// URL ↔ 필터 상태 양방향 동기화(외부 시스템 = 주소창).
// - 쓰기: 상태가 바뀌면 replaceState로 URL 반영.
// - 읽기: popstate(뒤로/앞으로)로 URL이 바뀌면 onExternalChange로 상태 되읽기 요청.
export function useProductListUrlSync(state: FilterState, onExternalChange: () => void) {
  const { category, minPrice, maxPrice, sortBy, searchQuery, inStockOnly, page } = state;

  useEffect(() => {
    const query = buildFilterQuery({
      category,
      minPrice,
      maxPrice,
      sortBy,
      searchQuery,
      inStockOnly,
      page,
    });
    window.history.replaceState(null, "", `?${query}`);
  }, [category, minPrice, maxPrice, sortBy, searchQuery, inStockOnly, page]);

  useEffect(() => {
    const handlePopState = () => onExternalChange();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onExternalChange]);
}
