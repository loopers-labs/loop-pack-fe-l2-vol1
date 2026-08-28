import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/fetcher';
import type { OrderListResponse } from '@/entities/order/model';

// 주문 내역은 세션 쿠키가 붙어야 200인 개인 데이터(미로그인 401)다.
// 서버 컴포넌트 prefetch는 쿠키를 전달하지 않으므로 클라이언트에서만 호출한다.
export const fetchOrders = (signal?: AbortSignal) =>
  apiFetch<OrderListResponse>('/api/orders', { signal });

export const orderQueries = {
  list: () =>
    queryOptions({
      queryKey: ['orders', 'list'],
      queryFn: ({ signal }) => fetchOrders(signal),
      // 주문 내역은 내가 주문하는 순간에만 늘어난다. 체크아웃 구현 시 주문 완료
      // 시점에 invalidate하는 흐름을 전제로 staleTime 기본값(1분)을 활용한다.
    }),
};
