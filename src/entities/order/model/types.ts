export interface OrderItem {
  productId: string
  quantity: number
}

export interface Order {
  id: string
  createdAt: string
  items: OrderItem[]
}

export interface OrderCreateRequest {
  items: OrderItem[]
}

export interface OrderCreateResponse {
  order: Order
}

export interface OrderListResponse {
  orders: Order[]
}
