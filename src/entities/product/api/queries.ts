import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'
import { getProductList } from './api'
import type { GetProductListParams, GetProductListResponse } from './model'
import { ApiError } from '@/shared/api/api-error'

export const shouldThrowProductListError = (error: Error) => !(error instanceof ApiError)

export const productQueryKeys = {
  all: ['product'] as const,
  list: (params: GetProductListParams) => [...productQueryKeys.all, 'list', params] as const,
}

export const productQueries = {
  list: (params: GetProductListParams) =>
    queryOptions({
      queryKey: productQueryKeys.list(params),
      // React Query가 넘기는 signal을 요청에 연결한다. 조건을 빠르게 연달아 바꾸면
      // 더 이상 필요 없어진 이전 요청이 실제로 취소되어 응답을 기다리지 않는다.
      queryFn: ({ signal }) => getProductList(params, signal),
      // 페이지·검색 조건이 바뀌며 재조회되므로 이전 목록을 유지해 깜빡임을 막는다.
      placeholderData: keepPreviousData,
      // 같은 검색·필터 결과를 재사용해 요청을 줄인다. 재고·할인가격처럼
      // 신선도가 중요한 정보가 목록에 추가되면 더 짧은 값으로 재검토한다.
      staleTime: 5 * 60 * 1000,
      // 예상 가능한 HTTP·네트워크 실패는 필터가 남는 인라인 UI에서 복구한다.
      // 응답 파싱 오류 등 API 계약 밖의 예외만 상위 Error Boundary로 보낸다.
      throwOnError: shouldThrowProductListError,
    }),
}

// 조건을 바꾼 조회가 실패하면 새 query key에는 데이터가 없고, placeholderData는 pending 상태에서만
// 적용되므로 화면에 떠 있던 목록이 사라진다. 이때 마지막으로 성공한 목록을 Query 캐시에서 읽어
// "갱신 실패"와 "최초 실패"를 구분한다. 캐시를 조회만 하므로 서버 응답을 별도 상태로 복사하지 않는다.
export const getLatestProductList = (
  queryClient: QueryClient,
): GetProductListResponse | undefined => {
  const latestKey = queryClient
    .getQueryCache()
    .findAll({ queryKey: productQueryKeys.all })
    .filter((query) => query.state.data !== undefined)
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
    .at(0)?.queryKey

  return latestKey ? queryClient.getQueryData<GetProductListResponse>(latestKey) : undefined
}
