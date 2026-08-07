import { describe, expect, it } from 'vitest'

import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'
import { getQueryClient } from '@/shared/lib/getQueryClient'

describe('provider QueryClient defaults', () => {
  it('wires the shared retry and throw predicates as query defaults', () => {
    const queryDefaults = getQueryClient().getDefaultOptions().queries

    expect(queryDefaults?.retry).toBe(ApiErrorPolicy.retry)
    expect(queryDefaults?.throwOnError).toBe(ApiErrorPolicy.throwOnError)
  })

  it('preserves existing stale and refetch defaults', () => {
    const queryDefaults = getQueryClient().getDefaultOptions().queries

    expect(queryDefaults?.staleTime).toBe(30_000)
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false)
  })
})
