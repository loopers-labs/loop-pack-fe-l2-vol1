import { queryOptions } from '@tanstack/react-query';
import { listOrders } from './listOrders';

export const orderQueries = {
  all: () => ['orders'] as const,
  list: () =>
    queryOptions({
      queryKey: [...orderQueries.all(), 'list'],
      queryFn: listOrders
    })
};
