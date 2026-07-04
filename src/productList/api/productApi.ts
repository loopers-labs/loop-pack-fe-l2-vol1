import type { Product, ProductListResponse, SortBy } from "../types";

export type ProductListParams = {
  category: "all" | Product["category"];
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  pageSize: number;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
};

export async function fetchProductList(params: ProductListParams): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams({
    category: params.category,
    sort: params.sortBy,
    q: params.searchQuery,
    page: String(params.page),
    size: String(params.pageSize),
  });
  if (params.minPrice !== "") searchParams.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== "") searchParams.set("maxPrice", String(params.maxPrice));
  if (params.inStockOnly) searchParams.set("inStock", "true");

  const res = await fetch(`/api/products?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(`API 호출 실패 (status: ${res.status})`);
  }
  const data: ProductListResponse = await res.json();
  return data;
}
