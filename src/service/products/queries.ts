import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { getProductList } from '@/service/products/api'
import type { GetProductListParams } from '@/service/products/model'

export const productQueryKeys = {
  all: ['product'] as const,
  list: (params: GetProductListParams) => [...productQueryKeys.all, 'list', params] as const,
}

export const productQueries = {
  list: (params: GetProductListParams) =>
    queryOptions({
      queryKey: productQueryKeys.list(params),
      queryFn: () => getProductList(params),
      // 페이지·검색 조건이 바뀌며 재조회되므로 이전 목록을 유지해 깜빡임을 막는다.
      placeholderData: keepPreviousData,
      // 같은 검색·필터 결과를 재사용해 요청을 줄인다. 재고·할인가격처럼
      // 신선도가 중요한 정보가 목록에 추가되면 더 짧은 값으로 재검토한다.
      staleTime: 5 * 60 * 1000,
    }),
}
