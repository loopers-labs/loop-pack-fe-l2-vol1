import type { Order, OrderItem } from '@/entities/order/model/types';

const ordersByUser = new Map<string, Order[]>();
let orderSequence = 0;

export const orderRepository = {
  add(userId: string, items: OrderItem[]): Order {
    orderSequence += 1;

    const order: Order = {
      id: `o${orderSequence}`,
      createdAt: new Date().toISOString(),
      items,
    };

    ordersByUser.set(userId, [...(ordersByUser.get(userId) ?? []), order]);
    return order;
  },

  list(userId: string): Order[] {
    return ordersByUser.get(userId) ?? [];
  },

  reset(): void {
    ordersByUser.clear();
    orderSequence = 0;
  },
};
