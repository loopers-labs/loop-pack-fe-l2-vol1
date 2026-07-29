import { fetchJson } from '@/shared/api/http'
import type {
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from '@/types/commerce'

// 조건을 항상 완전한 형태로 정규화한다.
// query key와 실제 요청이 같은 객체를 쓰게 해서 둘이 어긋날 길을 막는다.
export type ProductListCondition = Required<ProductListQuery>

export const fetchHome = (signal?: AbortSignal) =>
  fetchJson<HomeResponse>('/api/home', signal)

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
