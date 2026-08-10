import { NetworkError, TimeoutError } from 'ky'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import { ApiClientError } from '@/shared/api/ApiClientError'
import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'

const request = new Request('https://example.test')

describe('ApiErrorPolicy.retry', () => {
  it.each([
    ['recognized 500', new ApiClientError('server error', 500)],
    ['recognized 599', new ApiClientError('server error', 599)],
    ['transport error', new NetworkError(request)],
    ['timeout error', new TimeoutError(request)],
  ])('allows only the first retry for %s', (_case, error) => {
    expect(ApiErrorPolicy.retry(0, error)).toBe(true)
    expect(ApiErrorPolicy.retry(1, error)).toBe(false)
  })

  it.each([
    ['recognized 400', new ApiClientError('client error', 400)],
    ['recognized 499', new ApiClientError('client error', 499)],
    ['schema error', new z.ZodError([])],
    ['JSON decoding error', new SyntaxError('invalid JSON')],
    ['unknown programming error', new TypeError('unexpected value')],
  ])('never retries %s', (_case, error) => {
    expect(ApiErrorPolicy.retry(0, error)).toBe(false)
    expect(ApiErrorPolicy.retry(1, error)).toBe(false)
  })
})

describe('ApiErrorPolicy.throwOnError', () => {
  it.each([
    ['recognized 400', new ApiClientError('client error', 400)],
    ['recognized 499', new ApiClientError('client error', 499)],
  ])('keeps %s in query error state', (_case, error) => {
    expect(ApiErrorPolicy.throwOnError(error)).toBe(false)
  })

  it.each([
    ['recognized 500', new ApiClientError('server error', 500)],
    ['recognized 599', new ApiClientError('server error', 599)],
    ['transport error', new NetworkError(request)],
    ['timeout error', new TimeoutError(request)],
    ['schema error', new z.ZodError([])],
    ['JSON decoding error', new SyntaxError('invalid JSON')],
    ['unknown programming error', new TypeError('unexpected value')],
  ])('throws %s to the error boundary', (_case, error) => {
    expect(ApiErrorPolicy.throwOnError(error)).toBe(true)
  })
})
