import { CATEGORIES, SORT_OPTIONS } from "../constants";
import type { CategoryFilter, FilterState, SortBy } from "../types";

// 문자열 → 유니온 좁히기: 옵션 목록에 있으면 그 값, 없으면 기본값(as 없이 검증).
function toCategory(value: string | null): CategoryFilter {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.value : "all";
}

function toSortBy(value: string | null): SortBy {
  const found = SORT_OPTIONS.find((s) => s.value === value);
  return found ? found.value : "latest";
}

function toPrice(value: string | null): number | "" {
  if (value === null || value === "") {
    return "";
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : "";
}

function toPage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// URL 쿼리스트링 → 검증된 필터 상태. 잘못된 값은 조용히 기본값으로 떨어진다.
export function parseFiltersFromUrl(search: string): FilterState {
  const params = new URLSearchParams(search);
  return {
    category: toCategory(params.get("category")),
    minPrice: toPrice(params.get("minPrice")),
    maxPrice: toPrice(params.get("maxPrice")),
    sortBy: toSortBy(params.get("sort")),
    searchQuery: params.get("q") ?? "",
    inStockOnly: params.get("inStock") === "true",
    page: toPage(params.get("page")),
  };
}

// 필터 상태 → URL 쿼리스트링. 기본값은 생략해서 URL을 깨끗하게 유지한다.
export function buildFilterQuery(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category !== "all") {
    params.set("category", state.category);
  }
  if (state.searchQuery) {
    params.set("q", state.searchQuery);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.sortBy !== "latest") {
    params.set("sort", state.sortBy);
  }
  if (state.minPrice !== "") {
    params.set("minPrice", String(state.minPrice));
  }
  if (state.maxPrice !== "") {
    params.set("maxPrice", String(state.maxPrice));
  }
  if (state.inStockOnly) {
    params.set("inStock", "true");
  }
  return params.toString();
}
