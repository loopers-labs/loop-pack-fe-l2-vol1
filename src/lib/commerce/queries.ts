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

export const commerceQueries = {
  home: () =>
    queryOptions({
      queryKey: ['home'] as const,
      queryFn: ({ signal }) => fetchHome(signal),
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    }),

  products: {
    all: () => ['products'] as const,
    lists: () => [...commerceQueries.products.all(), 'list'] as const,
    list: (condition: ProductListCondition) =>
      queryOptions({
        // 일반 → 구체 계층으로 목록 전체와 특정 조건을 각각 조준할 수 있다.
        queryKey: [...commerceQueries.products.lists(), condition],
        queryFn: ({ signal }) => fetchProducts(condition, signal),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      }),
  },
}
