import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type {
  Category,
  CategoryId,
  Product,
  ProductSort,
} from '@/entities/product/model/product'
import { fetchJson } from '@/shared/api/http'

// 상품 목록 화면의 조회 계약이다. 전송, query key, 캐시 정책을 한 자리에 둔다.
// entity가 아니라 page가 소유하는 근거는 RFC Decision 4에 있다. 소비 화면이 하나이고,
// 목록 전용 staleTime과 key 정책은 이 화면의 조회 정책이기 때문이다.

// 측정 재현용 제어값이다. 사용자 필터가 아니라 mock API에 응답 지연을 요구하는 조건이다.
// 서버 응답을 바꾸므로 조건에 포함해 query key와 실제 요청이 함께 갈리게 한다.
// 재현에 필요한 slow 하나만 둔다. empty와 error는 개별 API 호출로 확인하면 된다.
export const productListScenarioValues = ['slow'] as const

// 부재를 null로 표현한다. 조건 객체가 항상 완전한 모양이어야 key와 요청이 어긋나지 않는다.
export type ProductListScenario =
  (typeof productListScenarioValues)[number] | null

export type ProductListQuery = {
  q?: string
  category?: CategoryId | 'all'
  sort?: ProductSort
  page?: number
  pageSize?: number
  scenario?: ProductListScenario
}

// 조건을 항상 완전한 형태로 정규화한다.
// query key와 실제 요청이 같은 객체를 쓰게 해서 둘이 어긋날 길을 막는다.
export type ProductListCondition = Required<ProductListQuery>

export type ProductListResponse = {
  products: Product[]
  categories: Category[]
  totalCount: number
  page: number
  pageSize: number
}

export const fetchProducts = (
  condition: ProductListCondition,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams()
  // 빈 검색어는 조건이 아니므로 URL에서 뺀다. 나머지는 기본값도 명시한다.
  if (condition.q) params.set('q', condition.q)
  params.set('category', condition.category)
  params.set('sort', condition.sort)
  params.set('page', String(condition.page))
  params.set('pageSize', String(condition.pageSize))
  // 지원하지 않는 값과 부재는 조건이 아니다. 있을 때만 보내 평소 응답 시점을 유지한다.
  if (condition.scenario) params.set('scenario', condition.scenario)
  return fetchJson<ProductListResponse>(`/api/products?${params}`, signal)
}

// staleTime 30초: 조건 이동과 뒤로가기가 잦다. 캐시를 즉시 보여주고 오래되면 백그라운드 갱신한다.
// gcTime 5분(기본값 명시): 조건을 바꿨다 되돌아오는 동선을 덮고도 남는 보관 기간이다.
export const productListQueries = {
  all: () => ['products'] as const,
  lists: () => [...productListQueries.all(), 'list'] as const,
  list: (condition: ProductListCondition) =>
    queryOptions({
      // 일반에서 구체로 내려가는 계층이라 목록 전체와 특정 조건을 각각 조준할 수 있다.
      queryKey: [...productListQueries.lists(), condition],
      queryFn: ({ signal }) => fetchProducts(condition, signal),
      // 조건을 바꾸면 새 key라 데이터가 없어 화면이 통째로 비었다. 목록과 페이지네이션이
      // 사라지면 사용자는 어디까지 보고 있었는지도 잃는다. 이전 결과를 자리에 남긴다.
      // 대신 화면이 그것을 현재 조건의 결과처럼 보여주면 안 된다. isPlaceholderData로 구분한다.
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    }),
}
