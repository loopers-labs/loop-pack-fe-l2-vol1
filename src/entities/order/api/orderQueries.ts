import { queryOptions } from '@tanstack/react-query';
import { protectedRequestMeta } from '@/shared/api/requestMeta';
import { fetchOrders } from './orderService';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
};

export function orderListQueryOptions() {
  return queryOptions({
    queryKey: orderKeys.list(),
    queryFn: ({ signal }) => fetchOrders({ signal }),
    meta: protectedRequestMeta,
    retry: false,
    staleTime: 0,
  });
}
