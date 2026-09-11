import type {
  Order,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderListResponse,
} from '@/types/auth';
import {
  HttpError,
  InvalidResponseError,
  UnauthorizedError,
} from '@/shared/api/errors';
import { apiUrl } from '@/shared/api/base-url';

function isOrder(value: unknown): value is Order {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'string' &&
    'items' in value &&
    Array.isArray(value.items)
  );
}

function isOrderCreateResponse(data: unknown): data is OrderCreateResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'order' in data &&
    isOrder(data.order)
  );
}

function isOrderListResponse(data: unknown): data is OrderListResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'orders' in data &&
    Array.isArray(data.orders) &&
    data.orders.every(isOrder)
  );
}

// 주문 API는 보호 경로(/checkout·/orders)에서만 불린다. proxy가 쿠키 없는 요청을 이미 걸렀으므로
// 여기서 만나는 401은 "쿠키는 있는데 서버가 인정하지 않는" 경우 = 만료다 (RFC D5).
function throwForStatus(res: Response, fallback: string): never {
  if (res.status === 401) {
    throw new UnauthorizedError('세션이 만료됐어요. 다시 로그인해주세요.');
  }
  throw new HttpError(res.status, fallback);
}

export async function createOrder(body: OrderCreateRequest): Promise<Order> {
  const res = await fetch(apiUrl('/api/orders'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throwForStatus(res, '주문을 만들지 못했습니다.');

  const data: unknown = await res.json();
  if (!isOrderCreateResponse(data)) {
    throw new InvalidResponseError('주문 응답 형식이 올바르지 않습니다.');
  }
  return data.order;
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(apiUrl('/api/orders'));
  if (!res.ok) throwForStatus(res, '주문 내역을 불러오지 못했습니다.');

  const data: unknown = await res.json();
  if (!isOrderListResponse(data)) {
    throw new InvalidResponseError('주문 내역 응답 형식이 올바르지 않습니다.');
  }
  return data.orders;
}
