import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderListResponse,
} from '@/entities/order/api/model'
import type { OrderItem } from '@/entities/order/model/order'
import { ApiError } from '@/shared/api/api-error'
import { fetchWithTimeout } from '@/shared/api/fetch-with-timeout'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'
import { isRecord } from '@/shared/lib/is-record'

const ORDERS_URL = () => `${getApiBaseUrl()}/api/orders`

/*
 * 상태 코드는 그대로 보존해 전역 세션 만료 처리가 401을 구분하게 한다.
 * 응답의 message를 우선 사용해 주문 요청 오류에서 사용자가 고칠 내용을 보여준다.
 */
const toApiError = async (fallbackMessage: string, response: Response) => {
  let message = fallbackMessage

  try {
    const body: unknown = await response.json()
    if (isRecord(body) && typeof body.message === 'string') {
      message = body.message
    }
  } catch {
    // JSON이 아니어도 기본 문구를 유지한다.
  }

  return new ApiError(message, { kind: 'http', status: response.status })
}

export const getOrderList = async (signal?: AbortSignal): Promise<GetOrderListResponse> => {
  let response: Response

  try {
    response = await fetchWithTimeout(ORDERS_URL(), { signal })
  } catch (cause) {
    // 취소는 오류 UI로 바꾸지 않고 원본 AbortError를 유지한다.
    if (signal?.aborted) {
      throw cause
    }

    throw new ApiError('주문 내역 요청 중 네트워크 오류가 발생했습니다.', {
      kind: 'network',
      cause,
    })
  }

  if (!response.ok) {
    throw await toApiError('주문 내역을 불러오지 못했습니다.', response)
  }

  const data: GetOrderListResponse = await response.json()
  return data
}

export const createOrder = async (items: OrderItem[]): Promise<CreateOrderResponse> => {
  const body: CreateOrderRequest = { items }
  let response: Response

  try {
    response = await fetchWithTimeout(ORDERS_URL(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (cause) {
    throw new ApiError('주문 요청 중 네트워크 오류가 발생했습니다.', { kind: 'network', cause })
  }

  if (!response.ok) {
    throw await toApiError('주문을 처리하지 못했습니다.', response)
  }

  const data: CreateOrderResponse = await response.json()
  return data
}
