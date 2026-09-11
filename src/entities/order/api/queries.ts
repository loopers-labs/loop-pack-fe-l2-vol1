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
      /* 주문 직후 이동은 mutation이 미리 받은 목록을 사용하므로 잠시 fresh로 유지한다. */
      staleTime: 5_000,
    }),
}

export const orderMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...orderQueryKeys.all, 'create'],
      mutationFn: createOrder,
      networkMode: 'always',
    }),
}
