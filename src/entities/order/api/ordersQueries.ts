import { queryOptions } from '@tanstack/react-query';
import { getOrders } from '@/entities/order/api/orders';

export const ordersQueries = {
  all: () => ['orders'] as const,

  list: () =>
    queryOptions({
      queryKey: [...ordersQueries.all(), 'list'],
      queryFn: getOrders,
      // 401(비로그인·만료)은 재시도해도 결과가 바뀌지 않는다. 기본값(3회
      // 재시도, 지수 백오프)을 그대로 두면 전역 401 핸들러의 리다이렉트
      // 판정이 그만큼 늦어지고, 그동안 로딩 상태가 계속 떠 있게 된다.
      retry: false,
    }),
};
