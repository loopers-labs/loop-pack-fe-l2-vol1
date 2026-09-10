// 도메인을 모르는 전송 계층이다. 어떤 화면이 무엇을 부르는지 알지 않고,
// HTTP 실패를 상위가 판단할 수 있는 형태로 바꿔 올리는 것까지만 한다.
// 실패 문구와 복구 행위는 화면의 몫이므로 여기 두지 않는다.

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

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('네트워크 요청을 보내지 못했습니다.', { cause })
    this.name = 'NetworkError'
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

// 전송 계층이 설명할 수 있는 실패인가.
// status를 받았거나(ApiError), 우리가 끊었거나(타임아웃), 요청이 나가지 못한(네트워크) 경우다.
// 이 셋은 화면이 무엇이 잘못됐는지 알 수 있어 인라인으로 다룰 수 있다.
//
// 그 밖의 오류는 예상 밖이다. 200 응답의 본문이 계약을 어겨 파싱이 깨지는 경우가 대표적이다.
// 화면은 그것이 무엇인지도 어떻게 복구하는지도 모르므로 위로 올려야 한다.
export const isExpectedFailure = (error: unknown) =>
  error instanceof ApiError || error instanceof NetworkError || isTimeout(error)

// 재시도가 의미 있는 실패인가.
// 400대는 같은 요청을 다시 보내도 결과가 같다. 계약 위반도 다시 받아도 같은 본문이 온다.
// 다시 보내면 달라질 수 있는 것은 서버 오류, 타임아웃, 네트워크 단절뿐이다.
export const isRetryable = (error: unknown) => {
  if (error instanceof ApiError) return error.status >= 500
  return isTimeout(error) || error instanceof NetworkError
}

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
const request = async <T>(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<T> => {
  const timeout = new AbortController()
  const timer = setTimeout(() => {
    timeout.abort(
      new DOMException('요청 시간이 초과되었습니다.', 'TimeoutError'),
    )
  }, REQUEST_TIMEOUT_MS)

  try {
    let response: Response
    try {
      response = await fetch(url, {
        ...init,
        signal: signal
          ? AbortSignal.any([signal, timeout.signal])
          : timeout.signal,
      })
    } catch (error) {
      // 타임아웃과 Query가 요청을 취소한 AbortError의 의미는 보존한다.
      // fetch 호출 자체가 실패한 경우만 NetworkError로 승격해, 다른 코드에서 발생한
      // TypeError를 네트워크 실패로 잘못 삼키지 않는다.
      if (isTimeout(error) || isAbort(error)) throw error
      throw new NetworkError(error)
    }
    if (!response.ok) {
      throw new ApiError(response.status, await readServerMessage(response))
    }
    // 204는 본문이 없다. 없는 본문을 파싱하려 들면 성공한 요청이 파싱 오류로 실패한다.
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export const fetchJson = async <T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> => request<T>(url, {}, signal)

// 상태를 바꾸는 요청이다. 조회와 같은 실패 승격 규칙을 쓰되, 본문과 메서드만 다르다.
// 쿠키는 같은 origin 요청이라 브라우저가 알아서 싣는다. 여기서 credentials를 지정하지
// 않는 이유는, 절대 URL로 부르는 자리가 생겼을 때 조용히 세션이 실려 나가지 않게
// 기본값을 그대로 두기 위해서다.
export const postJson = async <T>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> =>
  request<T>(
    url,
    {
      method: 'POST',
      ...(body === undefined
        ? {}
        : {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }),
    },
    signal,
  )

const isAbort = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'
