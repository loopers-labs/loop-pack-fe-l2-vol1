import {
  type OrderCreateResponse,
  orderCreateResponseSchema,
  type OrderItem,
  type OrderListResponse,
  orderListResponseSchema,
} from '@/entities/order/model/OrderSchema'
import { apiClient } from '@/shared/api/ApiClient'

export class OrderRepository {
  constructor(private readonly api: typeof apiClient = apiClient) {}

  async createOrder(items: ReadonlyArray<OrderItem>) {
    const json = await this.api
      .post('api/orders', { json: { items } })
      .json<unknown>()
    return orderCreateResponseSchema.parse(json) satisfies OrderCreateResponse
  }

  async getOrders() {
    const json = await this.api.get('api/orders').json<unknown>()
    return orderListResponseSchema.parse(json) satisfies OrderListResponse
  }
}
