import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Product,
  ProductListResponse,
} from '@/entities/product/model/types'
import { ProductListView } from '@/views/product-list/ui/ProductListView'

import {
  renderProductListHarness,
  resetProductListHarnessState,
} from '../../../../tests/helpers/renderProductListHarness'
import { server } from '../../../../tests/setup/mswServer'

const nextNavigation = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => nextNavigation.searchParams,
}))

const product = {
  id: 'p-stanley',
  brand: 'Loopers',
  name: '스탠리 텀블러',
  category: 'home',
  price: 35_000,
  originalPrice: null,
  image: '/images/tumbler.webp',
  freeShipping: true,
  sizes: [{ value: 1, stock: 5 }],
  rating: 4.5,
  reviewCount: 3,
  createdAt: '2026-08-10T00:00:00.000Z',
} satisfies Product

const productList = (
  products: ProductListResponse['products'],
  totalCount = products.length,
  page = 1,
): ProductListResponse => ({
  products,
  categories: [{ id: 'home', name: '홈' }],
  totalCount,
  page,
  pageSize: 12,
})

describe('ProductList query states', () => {
  beforeEach(resetProductListHarnessState)
  afterEach(resetProductListHarnessState)

  it('ProductListView request assembly - when URL fields include a diagnostic scenario - forwards the canonical request and renders the result', async () => {
    // Arrange
    const searchParams = new URLSearchParams({
      q: 'stanley',
      category: 'home',
      sort: 'price-desc',
      page: '2',
      scenario: 'slow',
    })
    nextNavigation.searchParams = searchParams
    let requestedSearch = ''
    server.use(
      http.get('http://localhost:3000/api/products', ({ request }) => {
        requestedSearch = new URL(request.url).searchParams.toString()
        return HttpResponse.json(productList([product], 13, 2))
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const NuqsTestingAdapter = withNuqsTestingAdapter({
      hasMemory: true,
      searchParams,
    })

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter>
          <ProductListView diagnosticScenario={{ scenario: 'slow' }} />
        </NuqsTestingAdapter>
      </QueryClientProvider>,
    )

    // Assert
    await screen.findByRole('heading', { name: product.name })
    expect(requestedSearch).toBe(
      'q=stanley&category=home&sort=price-desc&page=2&pageSize=12&scenario=slow',
    )
    expect(
      screen.getByRole('region', { name: '상품 검색 결과' }),
    ).toHaveTextContent('총 13개')
  })

  it('Product list query - when the API responds successfully - removes loading status and shows products', async () => {
    // Arrange
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productList([product])),
      ),
    )

    // Act
    renderProductListHarness()

    // Assert
    screen.getByText('상품을 불러오는 중…')
    await screen.findByRole('heading', { name: product.name })
    expect(
      screen.getByRole('region', { name: '상품 검색 결과' }),
    ).toHaveTextContent('총 1개')
    expect(screen.queryByText('상품을 불러오는 중…')).not.toBeInTheDocument()
  })

  it('Product list query - when a reachable later page is empty - shows the empty-page state with the total count', async () => {
    // Arrange
    server.use(
      http.get('http://localhost:3000/api/products', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        return HttpResponse.json(
          page === '2' ? productList([], 12, 2) : productList([]),
        )
      }),
    )

    // Act
    renderProductListHarness({ searchParams: '?page=2' })

    // Assert
    await screen.findByText('현재 페이지에 표시할 상품이 없습니다.')
    expect(
      screen.getByRole('region', { name: '상품 검색 결과' }),
    ).toHaveTextContent('총 12개')
  })

  it('Product list query - when the total result count is zero - shows the no-results state', async () => {
    // Arrange
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productList([])),
      ),
    )

    // Act
    renderProductListHarness()

    // Assert
    await screen.findByText('검색 결과가 없습니다.')
    expect(
      screen.getByRole('region', { name: '상품 검색 결과' }),
    ).toHaveTextContent('총 0개')
  })

  it('Product list query - when the API returns an HTTP error message - shows that message in the alert', async () => {
    // Arrange
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(
          { message: '상품을 가져올 수 없습니다.' },
          { status: 503 },
        ),
      ),
    )

    // Act
    renderProductListHarness()

    // Assert
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('상품을 가져올 수 없습니다.')
  })

  it('Product list query - when the API returns a malformed HTTP error body - shows the fallback message in the alert', async () => {
    // Arrange
    server.use(
      http.get(
        'http://localhost:3000/api/products',
        () => new HttpResponse('{', { status: 503 }),
      ),
    )

    // Act
    renderProductListHarness()

    // Assert
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('요청 중 오류가 발생했습니다.')
  })

  it('Product list retry - when a retry fails - keeps the alert visible', async () => {
    // Arrange
    const user = userEvent.setup()
    let requestCount = 0
    server.use(
      http.get('http://localhost:3000/api/products', () => {
        requestCount += 1
        return HttpResponse.json(
          { message: '일시적인 오류입니다.' },
          { status: 503 },
        )
      }),
    )

    renderProductListHarness()
    await screen.findByRole('alert')

    // Act
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    // Assert
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('일시적인 오류입니다.')
    expect(requestCount).toBe(2)
  })

  it('Product list retry - when a retry succeeds after an initial failure - removes the alert and shows products', async () => {
    // Arrange
    const user = userEvent.setup()
    let requestCount = 0
    server.use(
      http.get('http://localhost:3000/api/products', () => {
        requestCount += 1
        return requestCount === 2
          ? HttpResponse.json(productList([product]))
          : HttpResponse.json(
              { message: '일시적인 오류입니다.' },
              { status: 503 },
            )
      }),
    )
    renderProductListHarness()
    await screen.findByRole('alert')

    // Act
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    // Assert
    await screen.findByRole('heading', { name: product.name })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(requestCount).toBe(2)
  })
})
