import { fetchCommerceApi } from "@/shared/api/commerce-client";
import type { HomeResponse, ProductListQuery, ProductListResponse } from "@/types/commerce";

export type ProductListParams = Required<ProductListQuery>;

export function getHome(): Promise<HomeResponse> {
  return fetchCommerceApi<HomeResponse>("/api/home");
}

export function getProducts(params: ProductListParams): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams({
    category: params.category,
    sort: params.sort,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  const q = params.q.trim();
  if (q !== "") {
    searchParams.set("q", q);
  }

  return fetchCommerceApi<ProductListResponse>(`/api/products?${searchParams.toString()}`);
}
