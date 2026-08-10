import { describe, expect, it } from 'vitest'

import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'

import { getQueryClient } from './getQueryClient'

describe('getQueryClient', () => {
  it('returns a distinct client with the exact defaults on every call', () => {
    const first = getQueryClient()
    const second = getQueryClient()
    const expected = {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: ApiErrorPolicy.retry,
      throwOnError: ApiErrorPolicy.throwOnError,
    }

    expect(first).not.toBe(second)
    expect(first.getDefaultOptions().queries).toEqual(expected)
    expect(second.getDefaultOptions().queries).toEqual(expected)
  })

  it('does not share cache writes between clients', () => {
    const first = getQueryClient()
    const second = getQueryClient()
    const queryKey = ['isolation'] as const

    first.setQueryData(queryKey, 'first')

    expect(first.getQueryData(queryKey)).toBe('first')
    expect(second.getQueryData(queryKey)).toBeUndefined()
  })
})
