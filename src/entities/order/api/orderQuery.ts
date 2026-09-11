import { queryOptions } from "@tanstack/react-query";
import { fetchJson, isServerFault } from "@/shared/api";
import type { OrderListResponse } from "../model/types";

export const ORDERS_QUERY_KEY = ["orders"];

// 401은 여기서 접지 않는다. 보호된 리소스의 401은 만료 신호이고, 그 판단은
// QueryCache의 onError 한 곳이 한다(entities/session/model/sessionExpiry.ts).
// 여기서 null로 접어버리면 그 신호가 사라진다.
export function ordersQueryOptions() {
  return queryOptions({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: () => fetchJson<OrderListResponse>("/api/orders"),
    // 주문은 방금 만든 것이 바로 보여야 한다.
    staleTime: 0,
    throwOnError: (error) => isServerFault(error),
  });
}
