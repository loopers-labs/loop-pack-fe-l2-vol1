import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithTimeout } from './fetch-with-timeout'

const createPendingFetch = () =>
  vi.fn(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('The operation was aborted.', 'AbortError')),
          { once: true },
        )
      }),
  )

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('timeout이 지나면 요청을 중단한다', async () => {
    vi.useFakeTimers()
    const fetchMock = createPendingFetch()
    vi.stubGlobal('fetch', fetchMock)

    const request = fetchWithTimeout('/api/test', {}, 1_000)
    const rejection = expect(request).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(1_000)

    await rejection
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('호출자의 AbortSignal로 요청을 중단한다', async () => {
    const fetchMock = createPendingFetch()
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    const request = fetchWithTimeout('/api/test', { signal: controller.signal }, 1_000)
    const rejection = expect(request).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()

    await rejection
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
