import { queryOptions } from '@tanstack/react-query';
import { getOrders } from '@/entities/order/api/orders';

export const ordersQueries = {
  all: () => ['orders'] as const,

  list: () =>
    queryOptions({
      queryKey: [...ordersQueries.all(), 'list'],
      queryFn: getOrders,
    }),
};
