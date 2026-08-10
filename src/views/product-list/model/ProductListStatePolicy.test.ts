import {
  QueryClient,
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import type { ProductListRequest } from '@/entities/product/model/ProductListRequest'
import { ProductQueryKeyFactory } from '@/entities/product/model/ProductQueryKeyFactory'
import type { ProductListResponse } from '@/entities/product/model/types'

import { ProductListStatePolicy } from './ProductListStatePolicy'

type ProductListKey = ReturnType<typeof ProductQueryKeyFactory.productList>
type ProductListObserver = QueryObserver<
  ProductListResponse,
  Error,
  ProductListResponse,
  ProductListResponse,
  ProductListKey
>

const firstPageQuery = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
} as const satisfies ProductListRequest
const firstPage = {
  products: [],
  categories: [],
  totalCount: 30,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse
const emptyPage = {
  ...firstPage,
  totalCount: 0,
} satisfies ProductListResponse

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })
  return { promise, resolve: resolvePromise }
}

function waitForResult(
  observer: ProductListObserver,
  predicate: (result: QueryObserverResult<ProductListResponse>) => boolean,
) {
  return new Promise<QueryObserverResult<ProductListResponse>>((resolve) => {
    const unsubscribe = observer.subscribe((result) => {
      if (predicate(result)) {
        unsubscribe()
        resolve(result)
      }
    })
  })
}

function queryOptions(
  query: ProductListRequest,
  queryFn: (signal: AbortSignal) => Promise<ProductListResponse>,
): QueryObserverOptions<
  ProductListResponse,
  Error,
  ProductListResponse,
  ProductListResponse,
  ProductListKey
> {
  return {
    queryKey: ProductQueryKeyFactory.productList(query),
    queryFn: ({ signal }) => queryFn(signal),
    placeholderData: (previousData) => previousData,
    retry: 1,
    retryDelay: 0,
    throwOnError: false,
  }
}

describe('ProductListStatePolicy with QueryObserver', () => {
  it('shows cold pending without retained data', () => {
    const pending = createDeferred<ProductListResponse>()
    const queryClient = new QueryClient()
    const currentKey = ProductQueryKeyFactory.productList(firstPageQuery)
    const observer = new QueryObserver<
      ProductListResponse,
      Error,
      ProductListResponse,
      ProductListResponse,
      ProductListKey
    >(
      queryClient,
      queryOptions(firstPageQuery, () => pending.promise),
    )

    const result = observer.getCurrentResult()
    const state = ProductListStatePolicy.resolve({
      query: result,
      currentKey,
      lastSuccessfulKey: null,
      queryClient,
    })

    expect(result.isPending).toBe(true)
    expect(state.displayedData).toBeUndefined()
    expect(state.lastSuccessfulKey).toBeNull()
  })

  it('keeps placeholder data without updating successful key metadata', () => {
    const pending = createDeferred<ProductListResponse>()
    const queryClient = new QueryClient()
    const firstKey = ProductQueryKeyFactory.productList(firstPageQuery)
    queryClient.setQueryData(firstKey, firstPage)
    const observer = new QueryObserver<
      ProductListResponse,
      Error,
      ProductListResponse,
      ProductListResponse,
      ProductListKey
    >(
      queryClient,
      queryOptions(firstPageQuery, () => Promise.resolve(firstPage)),
    )
    const secondPageQuery = { ...firstPageQuery, page: 2 }
    const secondKey = ProductQueryKeyFactory.productList(secondPageQuery)
    const unsubscribe = observer.subscribe(() => undefined)

    observer.setOptions(queryOptions(secondPageQuery, () => pending.promise))
    const result = observer.getCurrentResult()
    const state = ProductListStatePolicy.resolve({
      query: result,
      currentKey: secondKey,
      lastSuccessfulKey: firstKey,
      queryClient,
    })

    expect(result.status).toBe('success')
    expect(result.isPlaceholderData).toBe(true)
    expect(result.isFetching).toBe(true)
    expect(result.dataUpdatedAt).toBe(0)
    expect(state.displayedData).toBe(firstPage)
    expect(state.displayedDataKey).toBe(firstKey)
    expect(state.lastSuccessfulKey).toBe(firstKey)
    unsubscribe()
  })

  it('records successful empty data as the latest successful key', async () => {
    const queryClient = new QueryClient()
    const currentKey = ProductQueryKeyFactory.productList(firstPageQuery)
    const observer = new QueryObserver<
      ProductListResponse,
      Error,
      ProductListResponse,
      ProductListResponse,
      ProductListKey
    >(
      queryClient,
      queryOptions(firstPageQuery, () => Promise.resolve(emptyPage)),
    )
    const resultPromise = waitForResult(
      observer,
      (result) => result.isSuccess && !result.isPlaceholderData,
    )

    const result = await resultPromise
    const state = ProductListStatePolicy.resolve({
      query: result,
      currentKey,
      lastSuccessfulKey: null,
      queryClient,
    })

    expect(state.displayedData).toBe(emptyPage)
    expect(state.displayedDataKey).toBe(currentKey)
    expect(state.lastSuccessfulKey).toBe(currentKey)
  })
})
