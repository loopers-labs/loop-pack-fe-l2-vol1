import type { Category, Product } from "@/entities/product";
import { fetchCommerceApi } from "@/shared/api/commerce-client";
import type { ProductSearchState } from "../lib/search-params";

// 상품 목록 페이지가 소유하는 API 계약 — mock(_contract.ts)과 의도적 중복 (RFC §2.8)
export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

// 검색 조건의 SoT는 URL — 파라미터 타입은 nuqs 파서에서 파생 (RFC §2.6 결정표 8행)
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
