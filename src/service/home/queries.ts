import { queryOptions } from '@tanstack/react-query'
import { getHome } from '@/service/home/api'

export const homeQueryKeys = {
  all: ['home'] as const,
}

export const homeQueries = {
  detail: () =>
    queryOptions({
      queryKey: homeQueryKeys.all,
      queryFn: getHome,
      // 신상품·인기상품의 최신 노출이 중요하므로 목록보다 짧게 유지한다.
      staleTime: 1 * 60 * 1000,
    }),
}
