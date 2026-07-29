import { queryOptions } from '@tanstack/react-query'
import type { Category, Product } from '@/entities/product/model/product'
import { fetchJson } from '@/shared/api/http'

// 홈 화면의 조회 계약이다. 배너, 카테고리, 인기 상품, 신상품을 한 응답으로 받는다.
// 여러 도메인이 섞인 응답이지만 소비 화면이 홈 하나라 홈이 소유한다. RFC Decision 4를 따른다.

export type HomeResponse = {
  banner: { title: string; description: string; image: string }
  categories: Category[]
  popularProducts: Product[]
  newProducts: Product[]
}

export const fetchHome = (signal?: AbortSignal) =>
  fetchJson<HomeResponse>('/api/home', signal)

// staleTime 60초: 배너와 랭킹은 분 단위로 바뀌지 않는다. 탐색 중 재방문에 재요청하지 않는다.
// gcTime 5분(기본값 명시): 다른 화면을 둘러보고 돌아오는 동선을 덮는다.
export const homeQuery = () =>
  queryOptions({
    queryKey: ['home'] as const,
    queryFn: ({ signal }) => fetchHome(signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
