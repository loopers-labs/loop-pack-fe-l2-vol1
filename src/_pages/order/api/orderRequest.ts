import { apiClient } from '@/shared/api/apiClient';

import type { OrderCreateResponse, OrderItem } from '../model/types';

/** 주문을 넣는다. */
export const createOrder = (items: OrderItem[]) => apiClient.post<OrderCreateResponse>('/orders', { items });
