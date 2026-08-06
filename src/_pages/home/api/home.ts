import { queryOptions } from '@tanstack/react-query'
import type { Category, Product } from '@/entities/product/model/product'
import { apiUrl } from '@/shared/api/apiUrl'
import { fetchJson } from '@/shared/api/http'

// 홈 화면의 조회 계약이다. 배너, 카테고리, 인기 상품, 신상품을 한 응답으로 받는다.
// 여러 도메인이 섞인 응답이지만 소비 화면이 홈 하나라 홈이 소유한다. RFC Decision 4를 따른다.

export type HomeResponse = {
  banner: { title: string; description: string; image: string }
  categories: Category[]
  popularProducts: Product[]
  newProducts: Product[]
}

// origin은 서버만 넘긴다. 자기 주소를 몰라 절대 URL이 필요하기 때문이다.
// 브라우저는 넘기지 않아 상대 경로를 그대로 쓴다.
export interface HomeQueryOptions {
  origin?: string
}

export const fetchHome = (
  options: HomeQueryOptions = {},
  signal?: AbortSignal,
) => fetchJson<HomeResponse>(apiUrl('/api/home', options.origin), signal)

// staleTime 60초: 배너와 랭킹은 분 단위로 바뀌지 않는다. 탐색 중 재방문에 재요청하지 않는다.
// gcTime 5분(기본값 명시): 다른 화면을 둘러보고 돌아오는 동선을 덮는다.
//
// key에 origin을 넣지 않는다. 서버가 채운 캐시를 브라우저가 그대로 이어받아야 한다.
export const homeQuery = (options: HomeQueryOptions = {}) =>
  queryOptions({
    queryKey: ['home'] as const,
    queryFn: ({ signal }) => fetchHome(options, signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
