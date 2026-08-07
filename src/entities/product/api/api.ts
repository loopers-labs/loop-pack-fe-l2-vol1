import { fetchJson } from '@/shared/api/httpClient'
import type { ProductListQuery, ProductListResponse } from './types'

export function fetchProducts(
  query: ProductListQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  // 기본값도 명시적으로 요청에 싣는다 (특히 sort=latest — 4주차 생략 동작에 기대지 않음).
  const params = new URLSearchParams({
    q: query.q ?? '',
    category: query.category ?? 'all',
    sort: query.sort ?? 'latest',
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 12),
    // scenario=slow: 7주차 성능 실습의 재현 조건(1.5초 지연). fetchHome과 같은 방식이다.
    // 최적화 대상은 이 지연을 없애는 것이 아니라, 지연을 유지한 채 체감을 개선하는 것이다.
  })
  if (query.scenario) {
    params.set('scenario', query.scenario)
  }
  return fetchJson<ProductListResponse>(
    `/api/products?${params.toString()}`,
    typeof window === 'undefined' ? undefined : signal,
  )
}
