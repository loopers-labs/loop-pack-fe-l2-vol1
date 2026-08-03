import { NetworkError } from 'ky'
import { describe, expect, it } from 'vitest'

import { apiClient, ApiClientError } from '@/shared/api/ApiClient'

describe('apiClient HTTP error boundary', () => {
  it('preserves a valid 400 status and server message', async () => {
    const request = apiClient.get('https://example.test/client-error', {
      fetch: () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: '잘못된 요청입니다.' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '잘못된 요청입니다.',
      status: 400,
    })
  })

  it('preserves a valid 500 status and server message', async () => {
    const request = apiClient.get('https://example.test/server-error', {
      fetch: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ message: '서버 요청에 실패했습니다.' }),
            {
              status: 500,
              headers: { 'content-type': 'application/json' },
            },
          ),
        ),
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '서버 요청에 실패했습니다.',
      status: 500,
    })
  })

  it('makes one underlying attempt for a 500 response', async () => {
    let attemptCount = 0
    const request = apiClient.get('https://example.test/one-attempt', {
      fetch: () => {
        attemptCount += 1
        return Promise.resolve(
          new Response(JSON.stringify({ message: '일시적 오류입니다.' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
        )
      },
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    expect(attemptCount).toBe(1)
  })

  it('uses the generic fallback while preserving status for malformed error data', async () => {
    const request = apiClient.get('https://example.test/malformed-data', {
      fetch: () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 123 }), {
            status: 422,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '요청 중 오류가 발생했습니다.',
      status: 422,
    })
  })

  it('uses the generic fallback while preserving status for malformed JSON', async () => {
    const request = apiClient.get('https://example.test/malformed-json', {
      fetch: () =>
        Promise.resolve(
          new Response('{', {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '요청 중 오류가 발생했습니다.',
      status: 500,
    })
  })

  it('uses the generic fallback while preserving status for non-JSON data', async () => {
    const request = apiClient.get('https://example.test/non-json', {
      fetch: () =>
        Promise.resolve(
          new Response('gateway unavailable', {
            status: 503,
            headers: { 'content-type': 'text/plain' },
          }),
        ),
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: '요청 중 오류가 발생했습니다.',
      status: 503,
    })
  })

  it('propagates a transport error after one underlying attempt', async () => {
    let attemptCount = 0
    const request = apiClient.get('https://example.test/transport-error', {
      fetch: () => {
        attemptCount += 1
        return Promise.reject(
          new NetworkError(new Request('https://example.test/transport-error')),
        )
      },
    })

    await expect(request).rejects.toBeInstanceOf(NetworkError)
    expect(attemptCount).toBe(1)
  })
})
