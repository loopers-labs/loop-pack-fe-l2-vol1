import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../services/productApi";
import type { ProductQuery } from "../types";

/**
 * 상품 목록 서버 상태(데이터·로딩·에러)를 조회 조건에 맞춰 가져온다.
 * 캐싱·중복 제거·재요청·취소는 TanStack Query 에 위임한다.
 */
export function useProducts(query: ProductQuery) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["products", query],
    queryFn: ({ signal }) => fetchProducts(query, { signal }),
    // 필터를 바꿔 재요청하는 동안 이전 목록을 유지해 화면이 비지 않게 한다.
    placeholderData: keepPreviousData,
  });

  return {
    products: data?.products ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
