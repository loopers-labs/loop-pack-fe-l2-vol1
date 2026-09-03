import { queryOptions } from '@tanstack/react-query';
import { apiResponseResult } from '@/shared/api/response';
import type { OrderListResponse } from '@/entities/order/model/order';

export const ORDERS_QUERY_KEY = ['orders'] as const;

/**
 * 주문 내역. 401을 삼키지 않고 그대로 던진다.
 *
 * 세션 조회와 반대다. 세션 조회의 401은 "로그인하지 않았다"는 정상 응답이지만, 보호 경로
 * 데이터의 401은 "있어야 할 세션이 없다"는 뜻이라 만료 처리로 이어져야 한다. 그 판정과
 * 이동은 providers의 전역 처리기가 맡는다.
 */
export function ordersQueryOptions() {
  return queryOptions({
    queryKey: ORDERS_QUERY_KEY,
    // 인증이 필요한 조회임을 표시한다. 전역 401 처리기는 이 표시가 있는 요청만 만료로 다룬다 —
    // 표시가 없으면 공개 조회가 다른 사유로 401을 받았을 때도 로그인 화면으로 보내게 된다
    meta: { authRequired: true },
    queryFn: async (): Promise<OrderListResponse> =>
      (await apiResponseResult('/api/orders')) as OrderListResponse,
  });
}
