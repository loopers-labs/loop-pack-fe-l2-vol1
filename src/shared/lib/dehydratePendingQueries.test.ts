import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { dehydratePendingQueries } from './dehydratePendingQueries'

describe('dehydratePendingQueries', () => {
  it('includes a pending promise that later resolves successfully', async () => {
    const queryClient = new QueryClient()
    let resolveQuery: (value: string) => void = () => undefined
    const promise = new Promise<string>((resolve) => {
      resolveQuery = resolve
    })
    void queryClient.prefetchQuery({
      queryKey: ['pending'],
      queryFn: () => promise,
    })

    const state = dehydratePendingQueries(queryClient)
    const dehydratedQuery = state.queries[0]
    resolveQuery('resolved')

    expect(dehydratedQuery.state.status).toBe('pending')
    await expect(dehydratedQuery.promise).resolves.toBe('resolved')
  })

  it('redacts a pending rejection without causing an unhandled rejection', async () => {
    const queryClient = new QueryClient()
    let rejectQuery: (reason: Error) => void = () => undefined
    const promise = new Promise<string>((_resolve, reject) => {
      rejectQuery = reject
    })
    void queryClient.prefetchQuery({
      queryKey: ['rejecting'],
      queryFn: () => promise,
    })

    const state = dehydratePendingQueries(queryClient)
    const dehydratedPromise = state.queries[0]?.promise
    rejectQuery(new Error('private server detail'))

    await expect(dehydratedPromise).rejects.not.toMatchObject({
      message: 'private server detail',
    })
  })

  it('excludes settled errors and their state', async () => {
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['settled-error'],
      queryFn: () => Promise.reject(new Error('private server detail')),
    })

    expect(dehydratePendingQueries(queryClient).queries).toEqual([])
  })
})
