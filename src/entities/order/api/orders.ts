import { ApiError, readErrorMessage } from '@/shared/api';
import type { Order, OrderItem } from '@/entities/order/model';

export async function getOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response, '주문 내역을 불러오지 못했습니다.'),
    );
  }
  const data = (await response.json()) as { orders: Order[] };
  return data.orders;
}

export async function createOrder(items: OrderItem[]): Promise<Order> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response, '주문에 실패했습니다.'),
    );
  }
  const data = (await response.json()) as { order: Order };
  return data.order;
}
