import type {
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from '@/types/commerce'

// 조건을 항상 완전한 형태로 정규화한다.
// query key와 실제 요청이 같은 객체를 쓰게 해서 둘이 어긋날 길을 막는다.
export type ProductListCondition = Required<ProductListQuery>

// HTTP 실패를 status와 서버 메시지를 가진 타입으로 승격한다.
// status를 메시지 문자열에 섞으면 소비자가 문자열을 다시 파싱해야 하고,
// 재시도 가능 여부처럼 status로 갈리는 판단을 문자열 비교로 하게 된다.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    // 서버가 본문으로 보낸 메시지다. 본문이 없거나 JSON이 아닐 수 있어 optional이다.
    readonly serverMessage?: string,
  ) {
    super(serverMessage ?? `요청에 실패했습니다 (HTTP ${status})`)
    this.name = 'ApiError'
  }
}

// 400대는 같은 요청을 다시 보내도 결과가 같다. 재시도는 서버 오류와 네트워크 실패에만 쓴다.
// ApiError가 아닌 실패는 네트워크 단절이나 취소이므로 재시도 대상으로 둔다.
export const isRetryable = (error: unknown) =>
  !(error instanceof ApiError) || error.status >= 500

// 서버가 보낸 메시지가 있으면 그대로 보여주고, 없으면 화면이 정한 문구를 쓴다.
export const errorMessageOf = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.serverMessage
    ? error.serverMessage
    : fallback

// 실패 응답의 본문이 항상 JSON은 아니다. 빈 본문이나 프록시 오류 페이지가 그렇다.
// 읽지 못해도 여기서 던지지 않는다. 던지면 원래 HTTP 실패가 파싱 오류로 가려진다.
const readServerMessage = async (response: Response) => {
  try {
    const body: unknown = await response.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message !== ''
    ) {
      return body.message
    }
  } catch {
    // JSON 본문이 아니다. status만 가진 실패로 남긴다.
  }
  return undefined
}

// HTTP 실패를 throw로 승격한다. 쿼리가 에러 상태를 인지하는 유일한 통로다.
// signal은 React Query가 준다. 조건이 바뀌어 낡아진 요청을 취소하는 끈이다.
const fetchJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new ApiError(response.status, await readServerMessage(response))
  }
  return response.json() as Promise<T>
}

export const fetchHome = (signal?: AbortSignal) =>
  fetchJson<HomeResponse>('/api/home', signal)

export const fetchProducts = (
  condition: ProductListCondition,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams()
  // 빈 검색어는 조건이 아니므로 URL에서 뺀다. 나머지는 기본값도 명시한다.
  if (condition.q) params.set('q', condition.q)
  params.set('category', condition.category)
  params.set('sort', condition.sort)
  params.set('page', String(condition.page))
  params.set('pageSize', String(condition.pageSize))
  return fetchJson<ProductListResponse>(`/api/products?${params}`, signal)
}
