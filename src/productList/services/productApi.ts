import type { Product, ProductListResponse, SortBy } from "../types";

const PRODUCTS_ENDPOINT = "/api/products";

const FETCH_ALL_SIZE = 10_000;

export type ProductQuery = {
  category: "all" | Product["category"];
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortBy;
  searchQuery: string;
};

const buildQueryString = (query: ProductQuery) => {
  const { category, minPrice, maxPrice, sortBy, searchQuery } = query;
  const params = new URLSearchParams({
    category,
    sort: sortBy,
    q: searchQuery,
    size: String(FETCH_ALL_SIZE),
  });
  if (minPrice !== "") params.set("minPrice", String(minPrice));
  if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
  return params.toString();
};

export const fetchProducts = async (
  query: ProductQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> => {
  const res = await fetch(`${PRODUCTS_ENDPOINT}?${buildQueryString(query)}`, {
    signal,
  });
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
  return res.json();
};
