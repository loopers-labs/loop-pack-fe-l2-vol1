import { useCallback, useState } from "react";
import type { CategoryFilter, FilterState, SortBy } from "../types";
import { parseFiltersFromUrl } from "../utils/productListUrl";

// 필터·검색·정렬·페이지 상태를 관리하고, 조건이 바뀌면 페이지를 1로 되돌린다.
// 초기값은 URL에서 읽어온다(새로고침·링크 공유 시 필터 유지). 상태는 URL과 1:1이라 한 덩어리로 둔다.
// 액션은 useCallback으로 안정화 — useProducts/useProductListUrlSync가 이 참조를 deps로 쓴다.
export function useProductFilters() {
  const [filters, setFilters] = useState<FilterState>(() =>
    parseFiltersFromUrl(window.location.search),
  );

  const selectCategory = useCallback(
    (category: CategoryFilter) => setFilters((f) => ({ ...f, category, page: 1 })),
    [],
  );
  const changeMinPrice = useCallback(
    (minPrice: number | "") => setFilters((f) => ({ ...f, minPrice, page: 1 })),
    [],
  );
  const changeMaxPrice = useCallback(
    (maxPrice: number | "") => setFilters((f) => ({ ...f, maxPrice, page: 1 })),
    [],
  );
  const selectSort = useCallback(
    (sortBy: SortBy) => setFilters((f) => ({ ...f, sortBy, page: 1 })),
    [],
  );
  const search = useCallback(
    (searchQuery: string) => setFilters((f) => ({ ...f, searchQuery, page: 1 })),
    [],
  );
  const toggleInStock = useCallback(
    (inStockOnly: boolean) => setFilters((f) => ({ ...f, inStockOnly, page: 1 })),
    [],
  );
  const goToPage = useCallback((page: number) => setFilters((f) => ({ ...f, page })), []);
  const reset = useCallback(
    () =>
      setFilters({
        category: "all",
        minPrice: "",
        maxPrice: "",
        sortBy: "latest",
        searchQuery: "",
        inStockOnly: false,
        page: 1,
      }),
    [],
  );

  // popstate(뒤로/앞으로) 등 URL이 밖에서 바뀌었을 때 상태를 URL 기준으로 되읽는다.
  const syncFromUrl = useCallback(
    () => setFilters(parseFiltersFromUrl(window.location.search)),
    [],
  );

  return {
    filters,
    selectCategory,
    changeMinPrice,
    changeMaxPrice,
    selectSort,
    search,
    toggleInStock,
    goToPage,
    reset,
    syncFromUrl,
  };
}
