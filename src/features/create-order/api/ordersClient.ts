import type {
  Order,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderItem,
  OrderListResponse,
} from '@/entities/order'
import { requestProtectedJson } from '@/shared/api/protectedHttpClient'

const ORDERS_ENDPOINT = '/api/orders'

export async function createOrder(
  items: OrderItem[],
  signal?: AbortSignal,
): Promise<Order> {
  const request: OrderCreateRequest = { items }
  const response = await requestProtectedJson<OrderCreateResponse>(
    ORDERS_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    },
  )

  return response.order
}

export async function getOrders(signal?: AbortSignal): Promise<Order[]> {
  const response = await requestProtectedJson<OrderListResponse>(
    ORDERS_ENDPOINT,
    { signal },
  )

  return response.orders
}
