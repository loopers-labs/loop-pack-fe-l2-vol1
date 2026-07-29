import { queryOptions } from '@tanstack/react-query'
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

export type ProductListQuery = {
  q?: string
  category?: CategoryId | 'all'
  sort?: ProductSort
  page?: number
  pageSize?: number
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
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    }),
}
