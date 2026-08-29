import { createApiUrl, parseApiError } from "@/shared/api/apiUtils";
import type { Order, OrderItem } from "../model/types";

export type CreateOrderRequest = {
  items: OrderItem[];
};

export type CreateOrderResponse = {
  order: Order;
};

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await fetch(createApiUrl("/api/orders"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response, "주문을 생성하지 못했습니다.");
  }

  return response.json() as Promise<CreateOrderResponse>;
}
