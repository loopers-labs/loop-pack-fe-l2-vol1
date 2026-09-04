import { ApiError, apiFetch } from '@/shared/api/apiFetch';
import { SessionExpiredError } from '@/shared/api/SessionExpiredError';
import type { Order, OrderCreateRequest, OrderCreateResponse } from '../model/types';

// 보호 자원이라 401은 만료 상태 유일(listOrders.ts와 같은 기준).
export async function createOrder(request: OrderCreateRequest): Promise<Order> {
  try {
    const { order } = await apiFetch<OrderCreateResponse>('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request)
    });

    return order;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new SessionExpiredError();
    }

    throw error;
  }
}
