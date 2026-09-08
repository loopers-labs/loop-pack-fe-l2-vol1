import { queryOptions } from '@tanstack/react-query'
import type { ProductListQuery } from './types'
import { fetchProducts } from './api'

const PRODUCT_LIST_STALE_TIME = 30 * 1000
const GC_TIME = 5 * 60 * 1000

// 목록: 조건(q·category·sort·page)을 key와 요청에 모두 반영. 조건별 캐시 분리.
// staleTime 30초 — 목록은 잠깐 캐시된 값을 보여줘도 손해가 없다(최종 검증은 상세·결제).
//
// placeholderData: 조건이 무엇이든 직전 결과를 유지한다. 7주차 관측에서 필터를 바꿀 때만
// 목록이 통째로 사라지는 것이 확인됐다 — 사용자가 보던 화면을 1.5초 동안 잃는다.
// 5주차에는 "옛 결과가 새 조건의 결과로 오인될까 봐" 필터 변경에서만 비웠는데,
// 오인은 비우는 대신 흐림 처리와 별도 갱신 status로 막는다. 최초 로딩에만
// aria-busy를 적용해 갱신 중에도 사용자가 기존 목록을 계속 이용할 수 있게 한다.
//
// signal: TanStack Query가 넘겨주는 AbortSignal을 fetch까지 전달한다.
// 정합성은 아래 queryKey 분리가 이미 보장하고 있고, signal은 버려질 요청의
// 네트워크 낭비를 줄이는 별개 목적이다.
export function productListQueryOptions(query: ProductListQuery) {
  return queryOptions({
    queryKey: ['products', query] as const,
    queryFn: ({ signal }) => fetchProducts(query, signal),
    staleTime: PRODUCT_LIST_STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: (previousData) => previousData,
  })
}
