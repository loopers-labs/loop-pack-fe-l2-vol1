import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'
import {
  ApiError,
  NetworkError,
  REQUEST_TIMEOUT_MS,
  errorMessageOf,
  fetchJson,
  isExpectedFailure,
  isRetryable,
  isTimeout,
} from './http'

// 전송 계층이 실패를 어떤 형태로 올리는지 검증한다.
// 실패는 status와 서버 메시지를 구조로 남겨야 소비자가 문자열을 파싱하지 않는다.
//
// 응답은 MSW가 네트워크에서 만든다. fetch를 바꿔치기하면 이 파일이 검증하려는 것
// (요청이 나가고, 상태 코드를 읽고, 중단 신호가 전달되는 경로)이 통째로 빠진다.
// 도메인 API가 아니라 전송 자체가 대상이라 이 파일 전용 origin을 쓴다.
const TRANSPORT_URL = 'http://transport.test/things'

const respondWith = (resolver: Parameters<typeof http.get>[1]) => {
  server.use(http.get(TRANSPORT_URL, resolver))
}

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

describe('fetchJson', () => {
  it('요청이 나가지 못하면 NetworkError로 구분한다', async () => {
    // 연결 자체가 실패하는 경우다. 응답이 없으므로 status가 없다.
    respondWith(() => HttpResponse.error())

    await expect(fetchJson(TRANSPORT_URL)).rejects.toBeInstanceOf(NetworkError)
  })

  it('성공 응답의 본문을 그대로 돌려준다', async () => {
    respondWith(() => HttpResponse.json({ ok: true }))

    await expect(fetchJson(TRANSPORT_URL)).resolves.toEqual({ ok: true })
  })

  it('호출자가 취소하면 진행 중인 요청이 중단된다', async () => {
    respondWith(async () => {
      await delay('infinite')
      return HttpResponse.json({})
    })
    const controller = new AbortController()

    const pending = rejectionOf(fetchJson(TRANSPORT_URL, controller.signal))
    controller.abort()
    const error = await pending

    // 취소는 실패가 아니다. NetworkError로 승격하면 화면이 오류를 띄운다.
    expect(error).toBeInstanceOf(DOMException)
    expect((error as DOMException).name).toBe('AbortError')
    expect(error).not.toBeInstanceOf(NetworkError)
  })

  it('호출자가 신호를 주지 않아도 응답이 없으면 타임아웃으로 끊는다', async () => {
    respondWith(async () => {
      await delay('infinite')
      return HttpResponse.json({})
    })

    vi.useFakeTimers()
    const pending = rejectionOf(fetchJson(TRANSPORT_URL))
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)
    const error = await pending
    vi.useRealTimers()

    expect(isTimeout(error)).toBe(true)
  })

  it('타임아웃 직전까지는 요청을 끊지 않는다', async () => {
    respondWith(async () => {
      await delay('infinite')
      return HttpResponse.json({})
    })

    vi.useFakeTimers()
    const settled = vi.fn()
    const pending = fetchJson(TRANSPORT_URL).then(settled, settled)
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1)
    expect(settled).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await pending
    vi.useRealTimers()

    expect(settled).toHaveBeenCalledOnce()
  })

  it('HTTP 실패는 throw로 승격된다. 쿼리가 에러 상태를 알 수 있는 유일한 길이다', async () => {
    respondWith(() => new HttpResponse(null, { status: 500 }))

    const error = await apiErrorOf(fetchJson(TRANSPORT_URL))

    expect(error.status).toBe(500)
  })

  it('실패 응답의 status와 서버 메시지를 구조로 전달한다', async () => {
    respondWith(() =>
      HttpResponse.json(
        { message: '요청 조건을 확인해주세요.' },
        { status: 400 },
      ),
    )

    const error = await apiErrorOf(fetchJson(TRANSPORT_URL))

    expect(error.status).toBe(400)
    expect(error.serverMessage).toBe('요청 조건을 확인해주세요.')
  })

  it('본문이 JSON이 아니면 status만 남기고 원래 실패를 가리지 않는다', async () => {
    // 프록시 오류 페이지나 빈 본문이 여기 해당한다.
    respondWith(
      () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 }),
    )

    const error = await apiErrorOf(fetchJson(TRANSPORT_URL))

    expect(error.status).toBe(502)
    expect(error.serverMessage).toBeUndefined()
    expect(error.message).toContain('HTTP 502')
  })
})

describe('실패 분류', () => {
  it('status, 타임아웃, 네트워크 단절은 전송 계층이 설명할 수 있는 실패다', () => {
    expect(isExpectedFailure(new ApiError(400))).toBe(true)
    expect(isExpectedFailure(new ApiError(500))).toBe(true)
    expect(
      isExpectedFailure(new DOMException('timed out', 'TimeoutError')),
    ).toBe(true)
    expect(isExpectedFailure(new NetworkError(new TypeError()))).toBe(true)
  })

  it('계약을 어긴 200 응답은 예상 밖 오류다', () => {
    // 화면은 이것이 무엇인지도 어떻게 복구하는지도 모른다. 위로 올라가야 한다.
    expect(isExpectedFailure(new SyntaxError('Unexpected token <'))).toBe(false)
    expect(
      isExpectedFailure(new Error('cannot read property of undefined')),
    ).toBe(false)
    expect(isExpectedFailure(new TypeError('programming bug'))).toBe(false)
  })

  it('400대는 재시도해도 결과가 같으므로 재시도 대상이 아니다', () => {
    expect(isRetryable(new ApiError(400))).toBe(false)
    expect(isRetryable(new ApiError(404))).toBe(false)
  })

  it('계약 위반도 다시 받아도 같은 본문이 오므로 재시도 대상이 아니다', () => {
    expect(isRetryable(new SyntaxError('Unexpected token <'))).toBe(false)
  })

  it('서버 오류와 네트워크 실패와 타임아웃은 재시도 대상이다', () => {
    expect(isRetryable(new ApiError(500))).toBe(true)
    expect(isRetryable(new NetworkError(new TypeError()))).toBe(true)
    expect(isRetryable(new DOMException('timed out', 'TimeoutError'))).toBe(
      true,
    )
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
