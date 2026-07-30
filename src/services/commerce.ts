import type { Category, CategoryId, Product, ProductSort } from "@/entities/product";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

// Phase 5에서 _pages/products/api로 분리 예정인 페이지 API 계약
export type ProductListQuery = {
  q?: string;
  category?: CategoryId | "all";
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type ProductListParams = Required<ProductListQuery>;

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
