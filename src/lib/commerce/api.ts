import type {
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from '@/types/commerce'

// 조건을 항상 완전한 형태로 정규화한다.
// query key와 실제 요청이 같은 객체를 쓰게 해서 둘이 어긋날 길을 막는다.
export type ProductListCondition = Required<ProductListQuery>

// HTTP 실패를 throw로 승격한다. 쿼리가 에러 상태를 인지하는 유일한 통로다.
const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`요청에 실패했습니다 (HTTP ${response.status})`)
  }
  return response.json() as Promise<T>
}

export const fetchHome = () => fetchJson<HomeResponse>('/api/home')

export const fetchProducts = (condition: ProductListCondition) => {
  const params = new URLSearchParams()
  // 빈 검색어는 조건이 아니므로 URL에서 뺀다. 나머지는 기본값도 명시한다.
  if (condition.q) params.set('q', condition.q)
  params.set('category', condition.category)
  params.set('sort', condition.sort)
  params.set('page', String(condition.page))
  params.set('pageSize', String(condition.pageSize))
  return fetchJson<ProductListResponse>(`/api/products?${params}`)
}
