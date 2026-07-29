// 도메인을 모르는 전송 계층이다. 어떤 화면이 무엇을 부르는지 알지 않고,
// HTTP 실패를 상위가 판단할 수 있는 형태로 바꿔 올리는 것까지만 한다.
// 실패 문구와 복구 행위는 화면의 몫이므로 여기 두지 않는다.

// 서버가 실패 본문으로 내려주는 형태다. mock 백엔드와 공유하는 계약이다.
export type ApiErrorResponse = {
  message: string
}

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

// 응답이 오지 않는 요청을 무한정 pending으로 두지 않는다. 화면이 로딩에서 멈추면
// 사용자는 재시도 출구조차 얻지 못한다. mock API의 고정 지연 500ms와 겹치지 않는 여유를 둔다.
export const REQUEST_TIMEOUT_MS = 10_000

const TIMEOUT_MESSAGE = '요청이 지연되어 중단했습니다. 다시 시도해주세요.'

// 타임아웃은 fetchJson이 TimeoutError라는 이름으로 중단시킨 경우다.
// 사용자가 화면을 떠나 발생하는 AbortError와 달리 실패로 보여줘야 한다.
export const isTimeout = (error: unknown) =>
  error instanceof DOMException && error.name === 'TimeoutError'

// 400대는 같은 요청을 다시 보내도 결과가 같다. 재시도는 서버 오류와 네트워크 실패에만 쓴다.
// ApiError가 아닌 실패는 네트워크 단절이나 타임아웃이므로 재시도 대상으로 둔다.
export const isRetryable = (error: unknown) =>
  !(error instanceof ApiError) || error.status >= 500

// 서버가 보낸 메시지가 있으면 그대로 보여주고, 없으면 화면이 정한 문구를 쓴다.
// 화면 문구를 인자로 받는 이유는 shared가 특정 화면의 문구를 알지 않기 위해서다.
export const errorMessageOf = (error: unknown, fallback: string) => {
  if (isTimeout(error)) return TIMEOUT_MESSAGE
  return error instanceof ApiError && error.serverMessage
    ? error.serverMessage
    : fallback
}

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
// 취소와 타임아웃을 함께 걸어 둘 중 먼저 오는 쪽이 요청을 끊게 한다.
// AbortSignal.timeout 대신 타이머를 직접 드는 이유는, 중단 이유를 명시하고
// 응답이 끝나는 즉시 타이머를 해제해 요청마다 대기 타이머가 남지 않게 하기 위해서다.
export const fetchJson = async <T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> => {
  const timeout = new AbortController()
  const timer = setTimeout(() => {
    timeout.abort(
      new DOMException('요청 시간이 초과되었습니다.', 'TimeoutError'),
    )
  }, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, timeout.signal])
        : timeout.signal,
    })
    if (!response.ok) {
      throw new ApiError(response.status, await readServerMessage(response))
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}
