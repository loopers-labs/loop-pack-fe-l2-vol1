import type { Filters, SortBy } from "./types.ts";

// Filters(types.ts) + 페이지네이션 상태(page)를 합쳐 URL 쿼리와 왕복시키는 형태.
export type QueryFilters = Filters & { page: number };

export const FILTER_DEFAULTS: QueryFilters = {
  category: "all",
  minPrice: "",
  maxPrice: "",
  sortBy: "latest",
  searchQuery: "",
  inStockOnly: false,
  page: 1,
};

const CATEGORY_ALLOWLIST: readonly string[] = ["all", "electronics", "fashion", "home", "beauty"];

function isCategory(value: string | null): value is Filters["category"] {
  return value !== null && CATEGORY_ALLOWLIST.includes(value);
}

const SORT_ALLOWLIST: readonly string[] = ["latest", "popular", "price-asc", "price-desc"];

function isSortBy(value: string | null): value is SortBy {
  return value !== null && SORT_ALLOWLIST.includes(value);
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function parseNonNegativeNumber(value: string | null): number | "" {
  if (value === null || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : "";
}

/** URL 쿼리 문자열을 필터로 파싱한다. 값이 없거나 잘못되면 기본값으로 떨어진다(throw 없음). */
export function parseQueryToFilters(search: string): QueryFilters {
  const params = new URLSearchParams(search);
  const category = params.get("category");
  const sort = params.get("sort");

  return {
    category: isCategory(category) ? category : FILTER_DEFAULTS.category,
    minPrice: parseNonNegativeNumber(params.get("minPrice")),
    maxPrice: parseNonNegativeNumber(params.get("maxPrice")),
    sortBy: isSortBy(sort) ? sort : FILTER_DEFAULTS.sortBy,
    searchQuery: params.get("q") ?? FILTER_DEFAULTS.searchQuery,
    inStockOnly: params.get("inStock") === "true",
    page: parsePositiveInt(params.get("page"), FILTER_DEFAULTS.page),
  };
}

/** 필터를 URL 쿼리 문자열로 직렬화한다. 기본값과 같은 필드는 URL에 싣지 않는다. */
export function serializeFiltersToQuery(filters: QueryFilters): string {
  const params = new URLSearchParams();
  if (filters.category !== FILTER_DEFAULTS.category) {
    params.set("category", filters.category);
  }
  if (filters.searchQuery) params.set("q", filters.searchQuery);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.sortBy !== FILTER_DEFAULTS.sortBy) {
    params.set("sort", filters.sortBy);
  }
  if (filters.minPrice !== "") {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== "") {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.inStockOnly) params.set("inStock", "true");
  return params.toString();
}
