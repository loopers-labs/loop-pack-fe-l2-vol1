import '@/analytics/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { registerProviders } from '@/analytics/logger'
import { ProductListView } from '@/views/product-list/ui/ProductListView'

import { server } from '../../../../tests/setup/mswServer'

const nextNavigation = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => nextNavigation.searchParams,
}))

type CapturedTrack = {
  readonly type: 'track'
  readonly event: string
  readonly properties: Record<string, unknown>
}

const calls: Array<CapturedTrack> = []

registerProviders([
  {
    name: 'capture',
    initialize() {},
    track: (event, properties) => {
      calls.push({ type: 'track', event, properties })
    },
    identify() {},
    reset() {},
  },
])

const tracked = (event: string) => calls.filter((call) => call.event === event)

const productListResponse = {
  products: [],
  categories: [{ id: 'home', name: '홈' }],
  totalCount: 0,
  page: 1,
  pageSize: 12,
}

function renderProductList(searchParams: URLSearchParams) {
  nextNavigation.searchParams = searchParams
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const NuqsTestingAdapter = withNuqsTestingAdapter({
    hasMemory: true,
    searchParams,
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter>
        <ProductListView diagnosticScenario={{ scenario: undefined }} />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  calls.length = 0
  nextNavigation.searchParams = new URLSearchParams()
})

describe('product list instrumentation', () => {
  it('emits product_list_view once for the default request scope', async () => {
    let requestCount = 0
    server.use(
      http.get('http://localhost:3000/api/products', () => {
        requestCount += 1
        return HttpResponse.json(productListResponse)
      }),
    )

    renderProductList(new URLSearchParams())

    await waitFor(() => {
      expect(tracked('product_list_view')).toHaveLength(1)
    })
    expect(tracked('product_list_view')[0].properties).toMatchObject({
      category: 'all',
      sort: 'latest',
      page: 1,
    })

    await waitFor(() => {
      expect(requestCount).toBeGreaterThanOrEqual(1)
    })
    expect(tracked('product_list_view')).toHaveLength(1)
  })

  it('emits the changed category for a filtered mount', async () => {
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productListResponse),
      ),
    )

    renderProductList(new URLSearchParams({ category: 'home' }))

    await waitFor(() => {
      expect(tracked('product_list_view')).toHaveLength(1)
    })
    expect(tracked('product_list_view')[0].properties.category).toBe('home')
  })
})
