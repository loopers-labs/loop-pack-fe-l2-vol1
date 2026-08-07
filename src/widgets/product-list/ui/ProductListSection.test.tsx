import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ProductListResponse } from '@/entities/product/model/types'

import { DisplayedProductGrid, ProductListSection } from './ProductListSection'

const emptyResponse = {
  products: [],
  categories: [],
  totalCount: 0,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse

function renderSection(
  queryClient: QueryClient,
  query: ReturnType<QueryObserver<ProductListResponse>['getCurrentResult']>,
  displayedData: ProductListResponse | undefined,
) {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <ProductListSection
        query={query}
        displayedData={displayedData}
        displayedDataKey={displayedData === undefined ? null : ['displayed']}
        scope="current-product-key"
      />
    </QueryClientProvider>,
  )
}

describe('ProductListSection presentation', () => {
  it('remounts the product grid when the displayed cache key changes', () => {
    const firstKey = ['products', 'list', { q: 'first' }] as const
    const secondKey = ['products', 'list', { q: 'second' }] as const

    const firstGrid = DisplayedProductGrid({
      displayedData: emptyResponse,
      displayedDataKey: firstKey,
    })
    const secondGrid = DisplayedProductGrid({
      displayedData: emptyResponse,
      displayedDataKey: secondKey,
    })

    expect(firstGrid.key).toBe(JSON.stringify(firstKey))
    expect(secondGrid.key).toBe(JSON.stringify(secondKey))
    expect(secondGrid.key).not.toBe(firstGrid.key)
  })

  it('renders a stable busy region and twelve skeleton slots while cold pending', () => {
    const queryClient = new QueryClient()
    const observer = new QueryObserver<ProductListResponse>(queryClient, {
      queryKey: ['products', 'pending'],
      queryFn: () => new Promise<ProductListResponse>(() => undefined),
    })
    const unsubscribe = observer.subscribe(() => undefined)

    const markup = renderSection(
      queryClient,
      observer.getCurrentResult(),
      undefined,
    )

    expect(markup).toContain('aria-label="상품 검색 결과"')
    expect(markup).toContain('aria-busy="true"')
    expect(markup).toContain('role="status"')
    expect(markup.match(/data-product-skeleton-slot="true"/g)).toHaveLength(12)
    expect(markup).not.toContain('role="alert"')
    unsubscribe()
  })

  it('renders successful empty separately from an error', () => {
    const queryClient = new QueryClient()
    const queryKey = ['products', 'empty'] as const
    queryClient.setQueryData(queryKey, emptyResponse)
    const observer = new QueryObserver<ProductListResponse>(queryClient, {
      queryKey,
      queryFn: () => Promise.resolve(emptyResponse),
    })

    const markup = renderSection(
      queryClient,
      observer.getCurrentResult(),
      emptyResponse,
    )

    expect(markup).toContain('aria-busy="false"')
    expect(markup).toContain('>0</span>개')
    expect(markup).toContain('min-w-8')
    expect(markup).toContain('text-left')
    expect(markup).toContain('tabular-nums')
    expect(markup).toContain('검색 결과가 없습니다.')
    expect(markup.match(/data-product-geometry-slot="true"/g)).toHaveLength(12)
    expect(markup).not.toContain('role="alert"')
  })

  it('keeps retained count and geometry beside a current-key error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const observer = new QueryObserver<ProductListResponse>(queryClient, {
      queryKey: ['products', 'error'],
      queryFn: () => Promise.reject(new Error('상품 목록 요청 실패')),
    })
    const errorResultPromise = new Promise<
      ReturnType<typeof observer.getCurrentResult>
    >((resolve) => {
      const unsubscribe = observer.subscribe((result) => {
        if (result.isError) {
          unsubscribe()
          resolve(result)
        }
      })
    })

    const errorResult = await errorResultPromise
    const coldMarkup = renderSection(queryClient, errorResult, undefined)
    const markup = renderSection(queryClient, errorResult, {
      ...emptyResponse,
      totalCount: 30,
    })

    expect(coldMarkup).toContain('aria-hidden="true"')
    expect(coldMarkup).toContain('invisible')
    expect(markup).toContain('aria-busy="false"')
    expect(markup).toContain('>30</span>개')
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('max-w-sm')
    expect(markup).toContain('min-w-40')
    expect(markup).toContain('상품 목록 요청 실패')
    expect(markup).toContain('<button')
    expect(markup.match(/data-product-geometry-slot="true"/g)).toHaveLength(12)
  })
})
