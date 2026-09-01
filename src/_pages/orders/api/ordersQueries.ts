import { apiClient } from '@/shared/api/apiClient';
import { queryOptions } from '@tanstack/react-query';

import type { OrderListResponse } from '../model/types';

const fetchOrders = () => apiClient.get<OrderListResponse>('/orders');

/**
 * 주문 내역 쿼리 팩토리. 브라우저에서만 쓴다.
 *
 * 홈과 달리 서버 prefetch 와 공용이 아니다. 보호 API 라 서버 분기의 fetch 가
 * 세션 쿠키를 싣지 못해 401 을 받는다 — 근거는 app/(shop)/orders/page.tsx 주석에 있다.
 *
 * staleTime 을 두지 않는다(기본 0). 주문을 넣고 돌아오면 목록이 곧바로 달라져야 하고,
 * 세션이 만료됐다면 그 사실도 재요청에서 401 로 드러나야 한다. 홈(5분)처럼 fresh 를
 * 길게 잡으면 방금 한 주문이 안 보이는 화면을 사용자가 보게 된다.
 */
export const ordersQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: ['orders'] as const,
      queryFn: fetchOrders,
    }),
};
