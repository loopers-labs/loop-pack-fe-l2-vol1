import { describe, expect, it } from 'vitest'

import { createQueryClient } from '@/app/providers'
import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'

describe('createQueryClient', () => {
  it('wires the shared retry and throw predicates as query defaults', () => {
    const queryDefaults = createQueryClient().getDefaultOptions().queries

    expect(queryDefaults?.retry).toBe(ApiErrorPolicy.retry)
    expect(queryDefaults?.throwOnError).toBe(ApiErrorPolicy.throwOnError)
  })

  it('preserves existing stale and refetch defaults', () => {
    const queryDefaults = createQueryClient().getDefaultOptions().queries

    expect(queryDefaults?.staleTime).toBe(30_000)
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false)
  })
})
