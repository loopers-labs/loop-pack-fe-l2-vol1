import { queryOptions } from '@tanstack/react-query';
import { fetchOrders } from './orderService';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
};

export function orderListQueryOptions() {
  return queryOptions({
    queryKey: orderKeys.list(),
    queryFn: ({ signal }) => fetchOrders({ signal }),
    retry: false,
    staleTime: 0,
  });
}
