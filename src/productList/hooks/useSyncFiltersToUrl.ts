import { useEffect } from "react";
import type { ProductFilters } from "../types";

/** 현재 필터/검색/페이지 상태를 브라우저 URL 쿼리에 동기화한다(외부 시스템 동기화). */
export function useSyncFiltersToUrl(filters: ProductFilters) {
  const {
    category,
    searchQuery,
    page,
    sortBy,
    minPrice,
    maxPrice,
    inStockOnly,
  } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (searchQuery) params.set("q", searchQuery);
    if (page > 1) params.set("page", String(page));
    if (sortBy !== "latest") params.set("sort", sortBy);
    if (minPrice !== "") params.set("minPrice", String(minPrice));
    if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
    if (inStockOnly) params.set("inStock", "true");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly]);
}
