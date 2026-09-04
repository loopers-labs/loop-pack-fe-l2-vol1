import { queryOptions } from '@tanstack/react-query';
import { getOrders } from './order.api';

export const orderQueries = {
  list: () =>
    queryOptions({
      queryKey: ['orders', 'list'] as const,
      queryFn: getOrders,
    }),
};
