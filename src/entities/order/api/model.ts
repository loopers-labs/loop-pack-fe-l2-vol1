import type { Order, OrderItem } from '@/entities/order/model/order'

export type CreateOrderRequest = {
  items: OrderItem[]
}

export type CreateOrderResponse = {
  order: Order
}

export type GetOrderListResponse = {
  orders: Order[]
}
