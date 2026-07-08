import type { Product, SortBy } from "../types";

const CATEGORY_FILTERS = [
  "all",
  "electronics",
  "fashion",
  "home",
  "beauty",
] as const;

const SORT_OPTIONS = ["latest", "popular", "price-asc", "price-desc"] as const;

export type CategoryValue = "all" | Product["category"];
export type PriceValue = number | "";

export type ProductFilterState = {
  category: CategoryValue;
  minPrice: PriceValue;
  maxPrice: PriceValue;
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  inStockOnly: boolean;
};

const isCategoryValue = (value: string | null): value is CategoryValue =>
  value !== null && CATEGORY_FILTERS.some((c) => c === value);

const isSortBy = (value: string | null): value is SortBy =>
  value !== null && SORT_OPTIONS.some((s) => s === value);

const readNumberParam = (params: URLSearchParams, key: string): PriceValue => {
  const value = params.get(key);
  if (value === null || value === "") return "";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
};

const readPageParam = (params: URLSearchParams): number => {
  const parsed = Number(params.get("page"));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const readFiltersFromUrl = (): ProductFilterState => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const sortBy = params.get("sort");

  return {
    category: isCategoryValue(category) ? category : "all",
    minPrice: readNumberParam(params, "minPrice"),
    maxPrice: readNumberParam(params, "maxPrice"),
    sortBy: isSortBy(sortBy) ? sortBy : "latest",
    searchQuery: params.get("q") ?? "",
    page: readPageParam(params),
    inStockOnly: params.get("inStock") === "true",
  };
};

export const buildFilterSearchParams = (
  filters: ProductFilterState,
): string => {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
  } = filters;
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  if (sortBy !== "latest") params.set("sort", sortBy);
  if (minPrice !== "") params.set("minPrice", String(minPrice));
  if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
  if (inStockOnly) params.set("inStock", "true");

  return params.toString();
};

export const syncFiltersToUrl = (filters: ProductFilterState): void => {
  window.history.replaceState(null, "", `?${buildFilterSearchParams(filters)}`);
};

export const pushFiltersToUrl = (filters: ProductFilterState): void => {
  window.history.pushState(null, "", `?${buildFilterSearchParams(filters)}`);
};
