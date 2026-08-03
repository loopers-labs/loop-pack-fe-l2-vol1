import { queryOptions } from "@tanstack/react-query";
import { isHttpError } from "@/shared/api";
import { fetchProductList } from "./fetch";
import type { ProductListQuery } from "./types";

// 목록은 검색·카테고리·정렬·페이지 조합마다 캐시 엔트리가 쌓이므로 gcTime을 짧게 잡아
// 더 이상 쓰지 않는 조합의 메모리를 빠르게 되돌린다(README §상태 소유권).
export function productListQueryOptions(query: ProductListQuery) {
  return queryOptions({
    queryKey: ["commerce", "products", query] as const,
    queryFn: () => fetchProductList(query),
    staleTime: 60000,
    gcTime: 300000,
    throwOnError: (error) => (isHttpError(error) ? error.status >= 500 : true),
  });
}
