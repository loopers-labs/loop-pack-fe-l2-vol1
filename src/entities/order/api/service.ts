import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderMutations, orderQueries } from '@/entities/order/api/queries'

export const useOrderListQuery = () => useQuery(orderQueries.list())

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...orderMutations.create(),
    // 주문 생성 직후 목록을 이동 전에 확정한다. invalidate 후 화면 진입과 동시에 재조회하면
    // 라우트 전환 과정에서 첫 요청이 취소되고 두 번째 요청이 생길 수 있다. 여기서 한 번 받아
    // 캐시에 넣어 두면 /orders는 빈 상태를 먼저 그리지 않고 같은 결과를 바로 사용한다.
    onSuccess: () =>
      queryClient.fetchQuery({
        ...orderQueries.list(),
        // 직전에 /orders의 빈 목록을 봤다면 5초 staleTime 안에서는 fetchQuery도 그 값을
        // 그대로 반환한다. 주문 생성 직후만큼은 캐시 신선도와 무관하게 서버 목록을 다시 받는다.
        staleTime: 0,
      }),
  })
}
