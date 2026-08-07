import {
  QueryClient,
  QueryObserver,
  type QueryObserverOptions,
} from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import type { ProductListRequest } from '@/entities/product/model/ProductListRequest'
import { ProductQueryKeyFactory } from '@/entities/product/model/ProductQueryKeyFactory'
import type { ProductListResponse } from '@/entities/product/model/types'

import { ProductListStatePolicy } from './ProductListStatePolicy'

type ProductListKey = ReturnType<typeof ProductQueryKeyFactory.productList>
type DeferredResponse = {
  readonly promise: Promise<ProductListResponse>
  readonly resolve: (response: ProductListResponse) => void
}

const baseQuery = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
} as const satisfies ProductListRequest
const finalResponse = {
  products: [],
  categories: [],
  totalCount: 3,
  page: 2,
  pageSize: 12,
} satisfies ProductListResponse

function createDeferred(): DeferredResponse {
  let resolvePromise: (value: ProductListResponse) => void = () => undefined
  const promise = new Promise<ProductListResponse>((resolve) => {
    resolvePromise = resolve
  })
  return { promise, resolve: resolvePromise }
}

function queryOptions(
  query: ProductListRequest,
  deferred: DeferredResponse,
  canceledQueries: Array<string>,
): QueryObserverOptions<
  ProductListResponse,
  Error,
  ProductListResponse,
  ProductListResponse,
  ProductListKey
> {
  return {
    queryKey: ProductQueryKeyFactory.productList(query),
    queryFn: ({ signal }) => {
      signal.addEventListener('abort', () => {
        canceledQueries.push(JSON.stringify(query))
      })
      return deferred.promise
    },
    placeholderData: (previousData) => previousData,
    retry: 1,
    retryDelay: 0,
    throwOnError: false,
  }
}

describe('rapid product key sequence', () => {
  it('cancels four superseded requests and records only page two success', async () => {
    const queryClient = new QueryClient()
    const canceledQueries: Array<string> = []
    const deferredByQuery = new Map<string, DeferredResponse>()
    const rapidQueries = [
      baseQuery,
      { ...baseQuery, q: 'stanley' },
      { ...baseQuery, q: 'stanley', category: 'home' as const },
      {
        ...baseQuery,
        q: 'stanley',
        category: 'home' as const,
        sort: 'price-asc' as const,
      },
      {
        ...baseQuery,
        q: 'stanley',
        category: 'home' as const,
        sort: 'price-asc' as const,
        page: 2,
      },
    ] satisfies ReadonlyArray<ProductListRequest>
    const firstDeferred = createDeferred()
    deferredByQuery.set(JSON.stringify(baseQuery), firstDeferred)
    const observer = new QueryObserver<
      ProductListResponse,
      Error,
      ProductListResponse,
      ProductListResponse,
      ProductListKey
    >(queryClient, queryOptions(baseQuery, firstDeferred, canceledQueries))
    const unsubscribe = observer.subscribe(() => undefined)

    for (const query of rapidQueries.slice(1)) {
      const deferred = createDeferred()
      deferredByQuery.set(JSON.stringify(query), deferred)
      observer.setOptions(queryOptions(query, deferred, canceledQueries))
    }

    const finalQuery = rapidQueries[4]
    const finalDeferred = deferredByQuery.get(JSON.stringify(finalQuery))
    expect(finalDeferred).toBeDefined()
    if (finalDeferred === undefined) {
      unsubscribe()
      return
    }
    const finalResultPromise = new Promise<ProductListResponse>((resolve) => {
      const stopWaiting = observer.subscribe((result) => {
        if (result.isSuccess && !result.isPlaceholderData) {
          stopWaiting()
          resolve(result.data)
        }
      })
    })
    finalDeferred.resolve(finalResponse)

    await finalResultPromise
    const finalKey = ProductQueryKeyFactory.productList(finalQuery)
    const state = ProductListStatePolicy.resolve({
      query: observer.getCurrentResult(),
      currentKey: finalKey,
      lastSuccessfulKey: null,
      queryClient,
    })

    expect(canceledQueries).toHaveLength(4)
    expect(observer.getCurrentResult().error).toBeNull()
    expect(state.lastSuccessfulKey).toBe(finalKey)
    expect(state.displayedData).toBe(finalResponse)
    unsubscribe()
  })
})
