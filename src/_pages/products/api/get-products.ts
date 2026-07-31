import type { Category, Product } from "@/entities/product";
import { fetchCommerceApi } from "@/shared/api/commerce-client";
import type { ProductSearchState } from "../lib/search-params";

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

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

  return fetchCommerceApi<ProductListResponse>(`/api/products?${searchParams.toString()}`);
}
