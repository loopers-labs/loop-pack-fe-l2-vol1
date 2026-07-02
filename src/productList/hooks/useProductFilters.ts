import { useReducer, useState } from "react";
import type {
  FilterAction,
  FilterState,
  ProductFilters,
  ProductQuery,
} from "../types";
import { isSortBy, isViewMode, parseFiltersFromUrl } from "../utils";
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

// 리셋 시 되돌릴 기본 필터 — URL 복원값이 아니라 "필터 없음" 상태다.
const INITIAL_FILTER_STATE: FilterState = {
  category: "all",
  minPrice: "",
  maxPrice: "",
  sortBy: "latest",
  searchQuery: "",
  page: 1,
  inStockOnly: false,
};

// 필터 조건이 바뀌면 항상 첫 페이지로 되돌린다 — 이 규칙을 각 케이스에 흩뿌리지 않고 여기 한곳에 모은다.
function filtersReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "setCategory":
      return { ...state, category: action.value, page: 1 };
    case "setMinPrice":
      return { ...state, minPrice: action.value, page: 1 };
    case "setMaxPrice":
      return { ...state, maxPrice: action.value, page: 1 };
    case "setSortBy":
      return { ...state, sortBy: action.value, page: 1 };
    case "setSearchQuery":
      return { ...state, searchQuery: action.value, page: 1 };
    case "setInStockOnly":
      return { ...state, inStockOnly: action.value, page: 1 };
    case "setPage":
      return { ...state, page: action.value };
    case "reset":
      return INITIAL_FILTER_STATE;
  }
}

/**
 * 상품 목록의 필터·검색·정렬·페이지·옵션 클라이언트 상태와 그 변경 핸들러를 관리한다.
 * 서버 조회에 필요한 부분만 추린 `query`(파생값)도 함께 제공한다.
 */
export function useProductFilters() {
  // 새로고침·북마크·공유로 다시 열어도 조건이 유지되도록 URL 에서 초기 상태를 복원한다(마운트 시 1회).
  const [state, dispatch] = useReducer(
    filtersReducer,
    window.location.search,
    parseFiltersFromUrl,
  );
  // viewMode 는 URL·서버조회와 무관한 단발 표시 옵션이라 reducer 밖 useState 로 둔다.
  const [viewMode, setViewMode] = useState<ProductFilters["viewMode"]>("grid");

  const handleCategoryChange = (next: ProductFilters["category"]) =>
    dispatch({ type: "setCategory", value: next });

  const handleMinPriceChange = (value: number | "") =>
    dispatch({ type: "setMinPrice", value });

  const handleMaxPriceChange = (value: number | "") =>
    dispatch({ type: "setMaxPrice", value });

  const handleSortChange = (value: string) => {
    if (isSortBy(value)) dispatch({ type: "setSortBy", value });
  };

  const handleSearchChange = (value: string) =>
    dispatch({ type: "setSearchQuery", value });

  const handleInStockToggle = (next: boolean) =>
    dispatch({ type: "setInStockOnly", value: next });

  const handleViewModeChange = (value: string) => {
    if (isViewMode(value)) setViewMode(value);
  };

  const handlePageChange = (next: number) =>
    dispatch({ type: "setPage", value: next });

  const handleResetFilters = () => dispatch({ type: "reset" });

  const filters: ProductFilters = { ...state, viewMode };

  // 입력이 매 키스트로크마다 요청을 유발하지 않도록 네트워크로 가는 값만 디바운스한다.
  // 카테고리·정렬·페이지는 단발 조작이라 즉시 반영한다.
  const debouncedSearchQuery = useDebouncedValue(
    state.searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedMinPrice = useDebouncedValue(
    state.minPrice,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedMaxPrice = useDebouncedValue(
    state.maxPrice,
    SEARCH_DEBOUNCE_MS,
  );

  // 서버로 보낼 조회 조건 — viewMode 같은 순수 표시 옵션만 뺀다.
  const query: ProductQuery = {
    category: state.category,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    sortBy: state.sortBy,
    searchQuery: debouncedSearchQuery,
    page: state.page,
    inStockOnly: state.inStockOnly,
  };

  return {
    filters,
    query,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handleViewModeChange,
    handlePageChange,
    handleResetFilters,
  };
}
