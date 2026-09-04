import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderListResponse,
} from '@/entities/order/api/model'
import type { OrderItem } from '@/entities/order/model/order'
import { ApiError } from '@/shared/api/api-error'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'
import { isRecord } from '@/shared/lib/is-record'

const ORDERS_URL = () => `${getApiBaseUrl()}/api/orders`

// status를 그대로 실어 올린다. 401을 구분할 수 있어야 전역 만료 처리가 받을 수 있다.
//
// 응답 본문의 message를 우선 쓴다. 주문 생성 400의 사유가 셋(빈 목록 / 없는 상품 id /
// 수량이 1 미만이거나 정수 아님)이라, 화면이 무엇을 고치면 되는지 보여주려면 서버 문구가 필요하다.
const toApiError = async (fallbackMessage: string, response: Response) => {
  let message = fallbackMessage

  try {
    const body: unknown = await response.json()
    if (isRecord(body) && typeof body.message === 'string') {
      message = body.message
    }
  } catch {
    // 본문이 JSON이 아니면 기본 문구를 쓴다. 여기서 더 할 수 있는 일이 없다.
  }

  return new ApiError(message, { kind: 'http', status: response.status })
}

export const getOrderList = async (signal?: AbortSignal): Promise<GetOrderListResponse> => {
  let response: Response

  try {
    response = await fetch(ORDERS_URL(), { signal })
  } catch (cause) {
    // 취소는 실패가 아니다. 원본 AbortError를 그대로 올려 호출자가 취소로 인식하게 둔다.
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
    response = await fetch(ORDERS_URL(), {
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
