import { PAGE_SIZE } from "../constants";
import type { CategoryFilter, ProductListResponse, SortBy } from "../types";

// 서버가 이해하는 조회 파라미터. inStock 같은 "클라이언트 전용" 필터는 여기 없다.
export type ProductQueryParams = {
  category: CategoryFilter;
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortBy;
  searchQuery: string;
  page: number;
};

// GET /api/products — 필터·정렬·페이지로 상품 목록을 조회한다.
// endpoint와 request/response 형태를 이 파일에만 둔다(컴포넌트·훅은 이 함수에만 의존 = DIP).
export async function fetchProducts(params: ProductQueryParams): Promise<ProductListResponse> {
  const search = new URLSearchParams({
    category: params.category,
    sort: params.sortBy,
    q: params.searchQuery,
    page: String(params.page),
    size: String(PAGE_SIZE),
  });
  if (params.minPrice !== "") {
    search.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice !== "") {
    search.set("maxPrice", String(params.maxPrice));
  }

  const res = await fetch(`/api/products?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`API 호출 실패 (status: ${res.status})`);
  }
  const data: ProductListResponse = await res.json();
  return data;
}
