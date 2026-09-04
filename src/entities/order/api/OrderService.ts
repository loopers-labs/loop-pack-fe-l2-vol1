import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { OrderRepository } from '@/entities/order/api/OrderRepository'
import type { OrderItem } from '@/entities/order/model/OrderSchema'

export class OrderService {
  constructor(private readonly repository = new OrderRepository()) {}

  getOrders(userId: string) {
    return queryOptions({
      queryKey: ['orders', userId] as const,
      queryFn: () => this.repository.getOrders(),
      meta: { requiresAuth: true },
    })
  }

  createOrder() {
    return mutationOptions({
      mutationKey: ['orders', 'create'] as const,
      mutationFn: (items: ReadonlyArray<OrderItem>) =>
        this.repository.createOrder(items),
      meta: { requiresAuth: true },
      retry: false,
    })
  }
}

export const orderEntity = new OrderService()
