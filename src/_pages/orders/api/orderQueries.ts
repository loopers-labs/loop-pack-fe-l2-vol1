import { queryOptions } from "@tanstack/react-query";
import { getBaseUrl, requestJson } from "@/shared/api";

// 주문 계약(클라이언트 소비) — 서버 타입을 상향 import 하지 않고 소비 계층에 로컬 정의.
export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};

type OrderListResponse = {
  orders: Order[];
};

type OrderCreateResponse = {
  order: Order;
};

// 주문 목록은 이 사용자의 주문 생성으로만 바뀌고, 그 변경은 createOrder 성공 시 invalidate 로 반영된다.
// 그러니 재mount·refocus 마다 재요청하는 건 바뀔 수 없는 데이터를 다시 긁는 낭비 — staleTime 으로 막는다.
const ORDER_STALE_TIME = 60 * 1000;

function getOrders(): Promise<OrderListResponse> {
  return requestJson<OrderListResponse>(`${getBaseUrl()}/api/orders`);
}

export const orderQueries = {
  all: () => ["orders"] as const,
  list: () =>
    queryOptions({
      queryKey: [...orderQueries.all(), "list"] as const,
      queryFn: getOrders,
      staleTime: ORDER_STALE_TIME,
      // 만료(성공 후 401) 인터셉트 대상임을 표시 — queryClient onError 가 이 플래그로 만료를 가른다.
      meta: { authGuarded: true },
    }),
};

export function createOrder(items: OrderItem[]): Promise<OrderCreateResponse> {
  return requestJson<OrderCreateResponse>(`${getBaseUrl()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}
