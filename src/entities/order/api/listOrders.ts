import { ApiError, apiFetch } from '@/shared/api/apiFetch';
import { SessionExpiredError } from '@/shared/api/SessionExpiredError';
import type { OrderListResponse } from '../model/types';

// 보호 자원이라 401은 만료 상태 유일
export async function listOrders(): Promise<OrderListResponse['orders']> {
  try {
    const { orders } = await apiFetch<OrderListResponse>('/api/orders');
    return orders;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new SessionExpiredError();
    }

    throw error;
  }
}
