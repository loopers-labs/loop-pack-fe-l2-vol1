import { useEffect, useState } from "react";
import { FILTER_DEFAULTS, parseQueryToFilters, serializeFiltersToQuery } from "./filterQuery.ts";
import type { Filters } from "./types.ts";

/**
 * 필터·검색·페이지 상태를 관리하고 URL 쿼리와 동기화하는 훅.
 * - 마운트 시 URL(`window.location.search`)에서 복원한다(lazy init).
 * - 상태가 바뀔 때마다 URL을 `replaceState`로 갱신한다(히스토리를 쌓지 않음).
 * - page를 제외한 필터가 바뀌면 page를 1로 리셋한다.
 */
export function useProductFilters() {
  const [initial] = useState(() => parseQueryToFilters(window.location.search));
  const [category, setCategoryState] = useState<Filters["category"]>(initial.category);
  const [minPrice, setMinPriceState] = useState<Filters["minPrice"]>(initial.minPrice);
  const [maxPrice, setMaxPriceState] = useState<Filters["maxPrice"]>(initial.maxPrice);
  const [sortBy, setSortByState] = useState<Filters["sortBy"]>(initial.sortBy);
  const [searchQuery, setSearchQueryState] = useState<Filters["searchQuery"]>(initial.searchQuery);
  const [inStockOnly, setInStockOnlyState] = useState<Filters["inStockOnly"]>(initial.inStockOnly);
  const [page, setPage] = useState<number>(initial.page);

  useEffect(() => {
    const query = serializeFiltersToQuery({
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

  const setCategory = (value: Filters["category"]) => {
    setCategoryState(value);
    setPage(1);
  };

  const setMinPrice = (value: Filters["minPrice"]) => {
    setMinPriceState(value);
    setPage(1);
  };

  const setMaxPrice = (value: Filters["maxPrice"]) => {
    setMaxPriceState(value);
    setPage(1);
  };

  const setSortBy = (value: Filters["sortBy"]) => {
    setSortByState(value);
    setPage(1);
  };

  const setSearchQuery = (value: Filters["searchQuery"]) => {
    setSearchQueryState(value);
    setPage(1);
  };

  const setInStockOnly = (value: Filters["inStockOnly"]) => {
    setInStockOnlyState(value);
    setPage(1);
  };

  const reset = () => {
    setCategoryState(FILTER_DEFAULTS.category);
    setMinPriceState(FILTER_DEFAULTS.minPrice);
    setMaxPriceState(FILTER_DEFAULTS.maxPrice);
    setSortByState(FILTER_DEFAULTS.sortBy);
    setSearchQueryState(FILTER_DEFAULTS.searchQuery);
    setInStockOnlyState(FILTER_DEFAULTS.inStockOnly);
    setPage(FILTER_DEFAULTS.page);
  };

  return {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    page,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSearchQuery,
    setInStockOnly,
    setPage,
    reset,
  };
}
