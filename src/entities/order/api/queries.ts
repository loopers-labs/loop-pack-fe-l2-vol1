import { queryOptions } from '@tanstack/react-query';

import type { OrderListResponse } from './order-api';

import { apiClient } from '@/shared/api-client';

const getOrders = () => apiClient<OrderListResponse>('/api/orders');

/**
 * 주문 도메인 쿼리 팩토리
 */
export const orderQueries = {
  all: () => ['orders'] as const,

  /**
   * 주문 내역은 계정 소유 데이터라 key에 userId를 넣는다.
   * 계정이 바뀌면 key가 달라져 이전 사용자의 캐시가 보이지 않고,
   * 로그아웃·만료의 removeQueries(all)이 한 번에 정리한다.
   */
  list: (userId: string) =>
    queryOptions({
      queryKey: [...orderQueries.all(), 'list', userId] as const,
      queryFn: getOrders,
    }),
};
