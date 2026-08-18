import type { ProductListResponse } from "@/types/commerce";
import { fetchCommerceApi } from "@/shared/api/commerce-client";
import type { ProductSearchState } from "../lib/search-params";

export type ProductListParams = ProductSearchState;

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

  if (params.scenario !== null) {
    searchParams.set("scenario", params.scenario);
  }

  return fetchCommerceApi<ProductListResponse>(`/api/products?${searchParams.toString()}`);
}
