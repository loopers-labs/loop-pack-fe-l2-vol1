import { PAGE_SIZE } from "../constants";
import type { ProductListResponse, ProductQuery } from "../types";

/** 서버 조회 조건을 `/api/products` 요청용 쿼리 파라미터로 변환한다. */
export function buildProductSearchParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams({
    category: query.category,
    sort: query.sortBy,
    q: query.searchQuery,
    page: String(query.page),
    size: String(PAGE_SIZE),
  });

  if (query.minPrice !== "") params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== "") params.set("maxPrice", String(query.maxPrice));
  if (query.inStockOnly) params.set("inStock", "true");

  return params;
}

/**
 * 상품 목록을 서버에서 가져온다.
 * 응답 형태 변환·에러 변환을 여기서 끝내 컴포넌트엔 필요한 형태만 전달한다.
 */
export async function fetchProducts(
  query: ProductQuery,
  options?: { signal?: AbortSignal },
): Promise<ProductListResponse> {
  const params = buildProductSearchParams(query);
  const res = await fetch(`/api/products?${params.toString()}`, {
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`상품 목록 조회 실패 (status: ${res.status})`);
  }

  const data: ProductListResponse = await res.json();
  return data;
}
