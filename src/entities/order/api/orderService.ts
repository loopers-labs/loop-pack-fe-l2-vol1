import type { z } from 'zod';
import {
  orderCreateResponseSchema,
  orderListResponseSchema,
} from '@/entities/order/model/types';
import type {
  OrderCreateRequest,
  OrderCreateResponse,
  OrderListResponse,
} from '@/entities/order/model/types';
import { HttpError } from '@/shared/api/HttpError';
import {
  getHttpErrorMessage,
  readHttpBody,
} from '@/shared/api/httpResponse';

export class OrderApiError extends HttpError {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message, status);
    this.name = 'OrderApiError';
  }
}

function parseResponse<T>(
  schema: z.ZodType<T>,
  body: unknown,
  fallback: string,
): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new Error(fallback);
  }

  return result.data;
}

function throwOrderError(
  response: Response,
  body: unknown,
  fallback: string,
): never {
  throw new OrderApiError(
    getHttpErrorMessage(body, fallback),
    response.status,
  );
}

export async function createOrder(
  request: OrderCreateRequest,
): Promise<OrderCreateResponse> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  const body = await readHttpBody(response);

  if (!response.ok) {
    throwOrderError(response, body, '주문을 완료하지 못했습니다.');
  }

  return parseResponse(
    orderCreateResponseSchema,
    body,
    '주문 응답을 확인하지 못했습니다.',
  );
}

export async function fetchOrders(options?: {
  signal?: AbortSignal;
}): Promise<OrderListResponse> {
  const response = await fetch('/api/orders', { signal: options?.signal });
  const body = await readHttpBody(response);

  if (!response.ok) {
    throwOrderError(response, body, '주문 내역을 불러오지 못했습니다.');
  }

  return parseResponse(
    orderListResponseSchema,
    body,
    '주문 내역 응답을 확인하지 못했습니다.',
  );
}
