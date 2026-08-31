import type { Order, OrderItem } from './types';

import { apiClient } from '@/shared/api-client';

export type OrderCreateRequest = {
  items: OrderItem[];
};

export type OrderCreateResponse = {
  order: Order;
};

export type OrderListResponse = {
  orders: Order[];
};

export function createOrder(request: OrderCreateRequest) {
  return apiClient<OrderCreateResponse>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
