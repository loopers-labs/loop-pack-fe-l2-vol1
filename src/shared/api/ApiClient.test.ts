import { NetworkError } from 'ky'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { apiClient } from '@/shared/api/ApiClient'
import { ApiClientError } from '@/shared/api/ApiClientError'

import { server } from '../../../tests/setup/mswServer'

describe('apiClient HTTP error boundary', () => {
  it('preserves a valid 400 status and server message', async () => {
    server.use(
      http.get('https://example.test/client-error', () =>
        HttpResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 }),
      ),
    )

    const request = apiClient.get('https://example.test/client-error')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '잘못된 요청입니다.',
      status: 400,
    })
  })

  it('preserves a valid 500 status and server message', async () => {
    server.use(
      http.get('https://example.test/server-error', () =>
        HttpResponse.json(
          { message: '서버 요청에 실패했습니다.' },
          { status: 500 },
        ),
      ),
    )

    const request = apiClient.get('https://example.test/server-error')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '서버 요청에 실패했습니다.',
      status: 500,
    })
  })

  it('makes one underlying attempt for a 500 response', async () => {
    let attemptCount = 0
    server.use(
      http.get('https://example.test/one-attempt', () => {
        attemptCount += 1
        return HttpResponse.json(
          { message: '일시적 오류입니다.' },
          { status: 500 },
        )
      }),
    )

    await expect(
      apiClient.get('https://example.test/one-attempt'),
    ).rejects.toBeInstanceOf(ApiClientError)
    expect(attemptCount).toBe(1)
  })

  it('uses the generic fallback while preserving status for malformed error data', async () => {
    server.use(
      http.get('https://example.test/malformed-data', () =>
        HttpResponse.json({ message: 123 }, { status: 422 }),
      ),
    )

    const request = apiClient.get('https://example.test/malformed-data')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '요청 중 오류가 발생했습니다.',
      status: 422,
    })
  })

  it('uses the generic fallback while preserving status for malformed JSON', async () => {
    server.use(
      http.get(
        'https://example.test/malformed-json',
        () =>
          new HttpResponse('{', {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )

    const request = apiClient.get('https://example.test/malformed-json')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '요청 중 오류가 발생했습니다.',
      status: 500,
    })
  })

  it('uses the generic fallback while preserving status for non-JSON data', async () => {
    server.use(
      http.get(
        'https://example.test/non-json',
        () =>
          new HttpResponse('gateway unavailable', {
            status: 503,
            headers: { 'content-type': 'text/plain' },
          }),
      ),
    )

    const request = apiClient.get('https://example.test/non-json')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '요청 중 오류가 발생했습니다.',
      status: 503,
    })
  })

  it('propagates a transport error after one underlying attempt', async () => {
    let attemptCount = 0
    server.use(
      http.get('https://example.test/transport-error', () => {
        attemptCount += 1
        return HttpResponse.error()
      }),
    )

    await expect(
      apiClient.get('https://example.test/transport-error'),
    ).rejects.toBeInstanceOf(NetworkError)
    expect(attemptCount).toBe(1)
  })
})
