import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { apiResponseResult } from '@/shared/api/response';
import type { OrderListResponse } from '@/entities/order/model/order';

export const ORDERS_QUERY_KEY = ['orders'] as const;

/**
 * 사용자가 바뀌는 자리에서 주문 캐시를 버린다.
 *
 * QueryClient는 탭에 하나뿐이라 로그아웃해도 이전 사용자의 주문 내역이 캐시에 남는다.
 * 같은 탭에서 다른 계정으로 로그인하면 그 사람에게 이전 사용자의 주문번호가 잠깐 보인다.
 * 로그아웃할 때 장바구니를 비운 근거가 그대로 적용되는 자리다.
 *
 * 진행 중인 조회를 먼저 취소한다. 취소하지 않으면 지운 뒤에 응답이 도착해 캐시가 다시 찬다.
 */
export async function clearOrdersCache(client: QueryClient): Promise<void> {
  await client.cancelQueries({ queryKey: ORDERS_QUERY_KEY });
  client.removeQueries({ queryKey: ORDERS_QUERY_KEY });
}

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
