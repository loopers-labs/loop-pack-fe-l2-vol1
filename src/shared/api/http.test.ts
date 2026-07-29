import {
  afterEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from 'vitest'
import {
  ApiError,
  errorMessageOf,
  fetchJson,
  isRetryable,
  isTimeout,
  REQUEST_TIMEOUT_MS,
} from './http'

// 전송 계층이 실패를 어떤 형태로 올리는지 검증한다.
// 실패는 status와 서버 메시지를 구조로 남겨야 소비자가 문자열을 파싱하지 않는다.
// 응답은 실제 Response로 만든다. 부분 객체를 캐스팅하면 본문 파싱 경로가 실물과 달라진다.

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status })

const stubFetch = (response: Response) => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const signalOf = (fetchMock: MockedFunction<typeof fetch>) => {
  const signal = fetchMock.mock.calls[0][1]?.signal
  if (!signal) throw new Error('요청에 중단 신호가 걸리지 않았다')
  return signal
}

// AbortSignal.reason은 DOM 타입 정의상 any다. 이 함수 하나로 가두고 밖으로는 unknown만 낸다.
const abortReasonOf = (signal: AbortSignal): unknown => signal.reason

// 실패를 기대하는 테스트가 매번 캐스팅하지 않도록, 여기서 타입을 좁혀서 돌려준다.
const rejectionOf = async (pending: Promise<unknown>): Promise<unknown> =>
  pending.then(
    () => {
      throw new Error('실패를 기대했지만 요청이 성공했다')
    },
    (thrown: unknown) => thrown,
  )

const apiErrorOf = async (pending: Promise<unknown>): Promise<ApiError> => {
  const thrown = await rejectionOf(pending)
  if (!(thrown instanceof ApiError)) {
    throw new Error(`ApiError를 기대했지만 ${String(thrown)}를 받았다`)
  }
  return thrown
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchJson', () => {
  it('성공 응답의 본문을 그대로 돌려준다', async () => {
    stubFetch(jsonResponse({ ok: true }))

    await expect(fetchJson('/api/things')).resolves.toEqual({ ok: true })
  })

  it('호출자의 취소 신호를 fetch까지 전달한다', async () => {
    const fetchMock = stubFetch(jsonResponse({}))
    const controller = new AbortController()

    await fetchJson('/api/things', controller.signal)

    // 타임아웃과 합쳐진 신호라 동일 객체는 아니다. 취소가 전달되는지로 검증한다.
    const passedSignal = signalOf(fetchMock)
    expect(passedSignal.aborted).toBe(false)
    controller.abort()
    expect(passedSignal.aborted).toBe(true)
  })

  it('호출자가 신호를 주지 않아도 타임아웃 신호를 건다', async () => {
    const fetchMock = stubFetch(jsonResponse({}))

    await fetchJson('/api/things')

    expect(signalOf(fetchMock).aborted).toBe(false)
  })

  it('응답이 오지 않으면 타임아웃으로 요청을 끊는다', async () => {
    const neverResolving = vi.fn<typeof fetch>((_input, init) => {
      const signal = init?.signal
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(abortReasonOf(signal))
        })
      })
    })
    vi.stubGlobal('fetch', neverResolving)

    vi.useFakeTimers()
    const pending = rejectionOf(fetchJson('/api/things'))
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)
    const error = await pending
    vi.useRealTimers()

    expect(isTimeout(error)).toBe(true)
  })

  it('HTTP 실패는 throw로 승격된다. 쿼리가 에러 상태를 알 수 있는 유일한 길이다', async () => {
    stubFetch(new Response(null, { status: 500 }))

    const error = await apiErrorOf(fetchJson('/api/things'))

    expect(error.status).toBe(500)
  })

  it('실패 응답의 status와 서버 메시지를 구조로 전달한다', async () => {
    stubFetch(jsonResponse({ message: '요청 조건을 확인해주세요.' }, 400))

    const error = await apiErrorOf(fetchJson('/api/things'))

    expect(error.status).toBe(400)
    expect(error.serverMessage).toBe('요청 조건을 확인해주세요.')
  })

  it('본문이 JSON이 아니면 status만 남기고 원래 실패를 가리지 않는다', async () => {
    // 프록시 오류 페이지나 빈 본문이 여기 해당한다.
    stubFetch(new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await apiErrorOf(fetchJson('/api/things'))

    expect(error.status).toBe(502)
    expect(error.serverMessage).toBeUndefined()
    expect(error.message).toContain('HTTP 502')
  })
})

describe('실패 분류', () => {
  it('400대는 재시도해도 결과가 같으므로 재시도 대상이 아니다', () => {
    expect(isRetryable(new ApiError(400))).toBe(false)
    expect(isRetryable(new ApiError(404))).toBe(false)
  })

  it('서버 오류와 네트워크 실패는 재시도 대상이다', () => {
    expect(isRetryable(new ApiError(500))).toBe(true)
    expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('서버 메시지가 있으면 화면 문구 대신 그것을 쓴다', () => {
    expect(
      errorMessageOf(new ApiError(400, '조건을 확인해주세요.'), '기본'),
    ).toBe('조건을 확인해주세요.')
    expect(errorMessageOf(new ApiError(500), '기본')).toBe('기본')
    expect(errorMessageOf(new TypeError('Failed to fetch'), '기본')).toBe(
      '기본',
    )
  })

  it('타임아웃은 서버 메시지가 없어도 전용 안내를 쓴다', () => {
    const timeout = new DOMException('timed out', 'TimeoutError')

    expect(isTimeout(timeout)).toBe(true)
    expect(isRetryable(timeout)).toBe(true)
    expect(errorMessageOf(timeout, '기본')).toContain('지연')
  })
})
