import { queryOptions } from '@tanstack/react-query'
import {
  fetchHome,
  fetchProducts,
  type ProductListCondition,
} from '@/lib/commerce/api'

// staleTime 근거
// 홈 60초: 배너와 랭킹은 분 단위로 바뀌지 않는다. 탐색 중 재방문에 재요청하지 않는다.
// 목록 30초: 조건 이동과 뒤로가기가 잦다. 캐시를 즉시 보여주고 오래되면 백그라운드 갱신한다.
// gcTime 5분(기본값 명시): 조건을 바꿨다 되돌아오는 동선을 덮고도 남는 보관 기간이다.

export const homeQuery = () =>
  queryOptions({
    queryKey: ['home'],
    queryFn: fetchHome,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })

export const productListQuery = (condition: ProductListCondition) =>
  queryOptions({
    // 조건 객체가 key다. 조건이 다르면 다른 캐시, 같으면 같은 캐시를 재사용한다.
    queryKey: ['products', condition],
    queryFn: () => fetchProducts(condition),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
