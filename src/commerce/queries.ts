import { queryOptions } from "@tanstack/react-query";
import { fetchHome, fetchProductList } from "./api/fetch";
import type { ProductListQuery } from "./api/types";

// 홈은 배너·카테고리처럼 거의 안 바뀌는 편집 데이터라 캐시를 길게 유지한다(README §상태 소유권).
export function homeQueryOptions() {
  return queryOptions({
    queryKey: ["commerce", "home"] as const,
    queryFn: fetchHome,
    staleTime: 300000,
    gcTime: 600000,
  });
}

// 목록은 검색·카테고리·정렬·페이지 조합마다 캐시 엔트리가 쌓이므로 gcTime을 짧게 잡아
// 더 이상 쓰지 않는 조합의 메모리를 빠르게 되돌린다(README §상태 소유권).
export function productListQueryOptions(query: ProductListQuery) {
  return queryOptions({
    queryKey: ["commerce", "products", query] as const,
    queryFn: () => fetchProductList(query),
    staleTime: 60000,
    gcTime: 300000,
  });
}
