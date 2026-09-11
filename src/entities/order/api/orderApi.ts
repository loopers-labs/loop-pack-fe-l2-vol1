import { apiFetch, parseApiError } from "@/shared/api/apiUtils";
import type { Order, OrderItem } from "../model/types";

export type CreateOrderRequest = {
  items: OrderItem[];
};

export type CreateOrderResponse = {
  order: Order;
};

export type OrderListResponse = {
  orders: Order[];
};

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await apiFetch("/api/orders", {
    auth: "required",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, "주문을 생성하지 못했습니다.");
  }

  return response.json() as Promise<CreateOrderResponse>;
}

export async function getOrders(): Promise<OrderListResponse> {
  const response = await apiFetch("/api/orders", { auth: "required" });

  if (!response.ok) {
    throw await parseApiError(response, "주문 내역을 불러오지 못했습니다.");
  }

  return response.json() as Promise<OrderListResponse>;
}
