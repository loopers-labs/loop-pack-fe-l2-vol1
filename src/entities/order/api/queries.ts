import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { createOrder, getOrderList } from '@/entities/order/api/api'

export const orderQueryKeys = {
  all: ['order'] as const,
  list: () => [...orderQueryKeys.all, 'list'] as const,
}

export const orderQueries = {
  list: () =>
    queryOptions({
      queryKey: orderQueryKeys.list(),
      queryFn: ({ signal }) => getOrderList(signal),
      // 주문 직후 이동은 mutation이 미리 받은 목록을 사용한다. 짧은 시간 동안 fresh로 두어
      // /orders가 마운트되며 같은 요청을 다시 보내지 않게 한다.
      staleTime: 5_000,
    }),
}

export const orderMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...orderQueryKeys.all, 'create'],
      mutationFn: createOrder,
    }),
}
