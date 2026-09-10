import type {
  Order,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderListResponse,
} from "@/types/auth";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

export async function getOrders(): Promise<Order[]> {
  const { orders } = await fetchCommerceApi<OrderListResponse>("/api/orders");
  return orders;
}

export async function createOrder(request: OrderCreateRequest): Promise<Order> {
  const { order } = await fetchCommerceApi<OrderCreateResponse>("/api/orders", {
    method: "POST",
    body: request,
  });
  return order;
}
