import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiError'
import {
  requestProtectedJson,
  setProtectedRequestNavigationForTest,
} from './protectedHttpClient'

const DEFAULT_ERROR_MESSAGE = '요청에 실패했습니다.'

describe('requestProtectedJson', () => {
  let restoreNavigation: (() => void) | undefined

  afterEach(() => {
    restoreNavigation?.()
    restoreNavigation = undefined
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function installNavigation(navigation: (url: string) => void): void {
    restoreNavigation = setProtectedRequestNavigationForTest(navigation)
  }

  it('returns typed JSON data from a successful response and preserves the request init', async () => {
    const controller = new AbortController()
    const init: RequestInit = {
      method: 'PATCH',
      headers: { 'x-request-id': 'request-1' },
      body: JSON.stringify({ quantity: 2 }),
      signal: controller.signal,
    }
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(Response.json({ orderId: 'order-1', quantity: 2 }))
    vi.stubGlobal('fetch', fetchSpy)

    const result = await requestProtectedJson<{
      orderId: string
      quantity: number
    }>('/api/orders/order-1', init)

    expect(result).toEqual({ orderId: 'order-1', quantity: 2 })
    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
      '/api/orders/order-1',
      init,
    )
  })

  it('returns undefined for a 204 response without attempting JSON parsing', async () => {
    const response = new Response(null, { status: 204 })
    const json = vi.spyOn(response, 'json')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(
      requestProtectedJson<void>('/api/auth/logout'),
    ).resolves.toBeUndefined()

    expect(json).not.toHaveBeenCalled()
  })

  it('returns undefined for a 205 response without attempting JSON parsing', async () => {
    const response = new Response(null, { status: 205 })
    const json = vi.spyOn(response, 'json')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(
      requestProtectedJson<void>('/api/auth/logout'),
    ).resolves.toBeUndefined()

    expect(json).not.toHaveBeenCalled()
  })

  it('navigates once with the encoded current path and query when the session expires', async () => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/orders',
        search: '?tab=past&filter=all',
      },
    })
    const navigations: string[] = []
    installNavigation((url) => {
      navigations.push(url)
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ message: '세션이 만료되었습니다.' }, { status: 401 }),
        ),
    )

    const request = requestProtectedJson('/api/orders')

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '세션이 만료되었습니다.',
    })

    expect(navigations).toEqual([
      '/login?reason=expired&returnTo=%2Forders%3Ftab%3Dpast%26filter%3Dall',
    ])
  })

  it('navigates once while concurrent expired requests reject with their own ApiErrors', async () => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/orders',
        search: '',
      },
    })
    const navigations: string[] = []
    installNavigation((url) => {
      navigations.push(url)
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ message: '첫 번째 세션 만료' }, { status: 401 }),
        )
        .mockResolvedValueOnce(
          Response.json({ message: '두 번째 세션 만료' }, { status: 401 }),
        ),
    )

    const [first, second] = await Promise.allSettled([
      requestProtectedJson('/api/orders/first'),
      requestProtectedJson('/api/orders/second'),
    ])

    if (first.status !== 'rejected' || second.status !== 'rejected') {
      throw new Error('Expired requests must reject.')
    }

    expect(first.reason).toBeInstanceOf(ApiError)
    expect(first.reason).toMatchObject({
      status: 401,
      message: '첫 번째 세션 만료',
    })
    expect(second.reason).toBeInstanceOf(ApiError)
    expect(second.reason).toMatchObject({
      status: 401,
      message: '두 번째 세션 만료',
    })
    expect(navigations).toEqual(['/login?reason=expired&returnTo=%2Forders'])
  })

  it('keeps the ApiError and retries expiry navigation after the navigation seam throws', async () => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/orders',
        search: '',
      },
    })
    const navigations: string[] = []
    let navigationAttempts = 0
    installNavigation((url) => {
      navigationAttempts += 1

      if (navigationAttempts === 1) {
        throw new Error('Navigation unavailable')
      }

      navigations.push(url)
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ message: '첫 번째 세션 만료' }, { status: 401 }),
        )
        .mockResolvedValueOnce(
          Response.json({ message: '두 번째 세션 만료' }, { status: 401 }),
        ),
    )

    await expect(
      requestProtectedJson('/api/orders/first'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '첫 번째 세션 만료',
    })
    await expect(
      requestProtectedJson('/api/orders/second'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '두 번째 세션 만료',
    })

    expect(navigationAttempts).toBe(2)
    expect(navigations).toEqual(['/login?reason=expired&returnTo=%2Forders'])
  })

  it('keeps the ApiError and retries expiry navigation after URL construction throws', async () => {
    vi.stubGlobal('window', {
      location: {
        get pathname(): string {
          throw new Error('Location unavailable')
        },
        search: '',
      },
    })
    const navigations: string[] = []
    installNavigation((url) => {
      navigations.push(url)
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ message: '첫 번째 세션 만료' }, { status: 401 }),
        )
        .mockResolvedValueOnce(
          Response.json({ message: '두 번째 세션 만료' }, { status: 401 }),
        ),
    )

    await expect(
      requestProtectedJson('/api/orders/first'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '첫 번째 세션 만료',
    })

    vi.stubGlobal('window', {
      location: {
        pathname: '/orders',
        search: '',
      },
    })

    await expect(
      requestProtectedJson('/api/orders/second'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '두 번째 세션 만료',
    })

    expect(navigations).toEqual(['/login?reason=expired&returnTo=%2Forders'])
  })

  it.each([400, 500])(
    'throws ApiError without redirecting for a %i response',
    async (status) => {
      const navigations: string[] = []
      installNavigation((url) => {
        navigations.push(url)
      })
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            Response.json(
              { message: '요청을 처리할 수 없습니다.' },
              { status },
            ),
          ),
      )

      const request = requestProtectedJson('/api/orders')

      await expect(request).rejects.toBeInstanceOf(ApiError)
      await expect(request).rejects.toMatchObject({
        name: 'ApiError',
        status,
        message: '요청을 처리할 수 없습니다.',
      })

      expect(navigations).toEqual([])
    },
  )

  it('uses the fallback message when an error response is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{not json', {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const request = requestProtectedJson('/api/orders')

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: DEFAULT_ERROR_MESSAGE,
    })
  })

  it('propagates a network rejection without triggering expiry navigation', async () => {
    const networkError = new TypeError('Network request failed')
    const navigations: string[] = []
    installNavigation((url) => {
      navigations.push(url)
    })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError))

    await expect(requestProtectedJson('/api/orders')).rejects.toBe(networkError)

    expect(navigations).toEqual([])
  })
})
