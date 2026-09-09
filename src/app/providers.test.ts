import { describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/shared/api/ApiClientError'
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

describe('provider protected request expiry boundary', () => {
  it('expires the session for a protected query 401', async () => {
    const onSessionExpired = vi.fn()
    const queryClient = getQueryClient({ onSessionExpired })

    await expect(
      queryClient.fetchQuery({
        queryKey: ['orders'],
        queryFn: () =>
          Promise.reject(new ApiClientError('로그인이 필요합니다.', 401)),
        meta: { requiresAuth: true },
      }),
    ).rejects.toBeInstanceOf(ApiClientError)

    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  it('does not expire the session for an unprotected query 401', async () => {
    const onSessionExpired = vi.fn()
    const queryClient = getQueryClient({ onSessionExpired })

    await expect(
      queryClient.fetchQuery({
        queryKey: ['auth', 'me'],
        queryFn: () =>
          Promise.reject(new ApiClientError('로그인이 필요합니다.', 401)),
      }),
    ).rejects.toBeInstanceOf(ApiClientError)

    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('expires the session for a protected mutation 401', async () => {
    const onSessionExpired = vi.fn()
    const queryClient = getQueryClient({ onSessionExpired })
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: ['orders', 'create'],
      mutationFn: () =>
        Promise.reject(new ApiClientError('로그인이 필요합니다.', 401)),
      meta: { requiresAuth: true },
    })

    await expect(mutation.execute(undefined)).rejects.toBeInstanceOf(
      ApiClientError,
    )

    expect(onSessionExpired).toHaveBeenCalledOnce()
  })
})
