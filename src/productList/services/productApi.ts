import type { Product, ProductListResponse, SortBy } from "../types";
import { PAGE_SIZE } from "../constants";

const PRODUCTS_ENDPOINT = "/api/products";

export type ProductQuery = {
  category: "all" | Product["category"];
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortBy;
  searchQuery: string;
  page: number;
};

const buildQueryString = (query: ProductQuery) => {
  const { category, minPrice, maxPrice, sortBy, searchQuery, page } = query;
  const params = new URLSearchParams({
    category,
    sort: sortBy,
    q: searchQuery,
    page: String(page),
    size: String(PAGE_SIZE),
  });
  if (minPrice !== "") params.set("minPrice", String(minPrice));
  if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
  return params.toString();
};

export const fetchProducts = async (
  query: ProductQuery,
): Promise<ProductListResponse> => {
  const res = await fetch(`${PRODUCTS_ENDPOINT}?${buildQueryString(query)}`);
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
  return res.json();
};
