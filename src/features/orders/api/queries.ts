import { queryOptions, useQuery } from "@tanstack/react-query";

import { useSession } from "@/entities/session/ui/SessionProvider";
import type { Order } from "@/features/orders/model/types";
import { fetchJson } from "@/shared/api/fetcher";

type OrderListResponse = { orders: Order[] };

// 주문내역은 보호 자원이다. meta.auth로 표시해 401(만료)이 전역 핸들러의 로그인 리다이렉트로 이어지게 한다.
export function ordersQueryOptions() {
  return queryOptions({
    queryKey: ["orders"] as const,
    queryFn: () => fetchJson<OrderListResponse>("/api/orders"),
    meta: { auth: true },
  });
}

// 익명은 발사하지 않는다(enabled). 로그인 상태(서버가 내린 값)일 때만 조회한다.
export function useOrders() {
  const { isLoggedIn } = useSession();
  return useQuery({
    ...ordersQueryOptions(),
    enabled: isLoggedIn,
    select: (data) => data.orders,
  });
}
