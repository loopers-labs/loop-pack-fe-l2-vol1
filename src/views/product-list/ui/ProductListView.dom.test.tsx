import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ProductService } from '@/entities/product/api/ProductService'
import { ProductListRouteParams } from '@/entities/product/model/ProductListRouteParams'
import type {
  Product,
  ProductListResponse,
} from '@/entities/product/model/types'
import { useProductFilters } from '@/features/product-filter/model/useProductFilters'
import { FilterBar } from '@/features/product-filter/ui/FilterBar'
import { useProductListState } from '@/views/product-list/model/useProductListState'
import { ProductListSection } from '@/widgets/product-list/ui/ProductListSection'

import { server } from '../../../../tests/setup/mswServer'

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

const productService = new ProductService()
let activeQueryClient: QueryClient | undefined

function ProductListHarness() {
  const { filters, updateFilter, updatePage } = useProductFilters()
  const request = ProductListRouteParams.toRequest({
    q: filters.q,
    category: filters.category,
    sort: filters.sort,
    page: String(filters.page),
  })
  const options = productService.getProductList(request)
  const query = useQuery(options)
  const state = useProductListState(
    query,
    options.queryKey,
    JSON.stringify(request),
  )

  return (
    <main>
      <FilterBar
        filters={filters}
        totalCount={state.displayedData?.totalCount ?? 0}
        pageSize={12}
        updateFilter={updateFilter}
        updatePage={updatePage}
      />
      <ProductListSection
        query={query}
        displayedData={state.displayedData}
        displayedDataKey={state.displayedDataKey}
        scope={JSON.stringify(request)}
      />
    </main>
  )
}

const renderProductList = (searchParams = '') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  activeQueryClient = queryClient
  const NuqsTestingAdapter = withNuqsTestingAdapter({
    hasMemory: true,
    searchParams,
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter>
        <ProductListHarness />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  )
}

const resetQueryClient = () => {
  activeQueryClient?.clear()
  activeQueryClient = undefined
}

describe('ProductList query states', () => {
  beforeEach(resetQueryClient)
  afterEach(resetQueryClient)

  it('Product list query - when the API responds successfully - removes loading status and shows products', async () => {
    // Arrange
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productList([product])),
      ),
    )

    // Act
    renderProductList()

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
    renderProductList('?page=2')

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
    renderProductList()

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
    renderProductList()

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
    renderProductList()

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

    renderProductList()
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
    renderProductList()
    await screen.findByRole('alert')

    // Act
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    // Assert
    await screen.findByRole('heading', { name: product.name })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(requestCount).toBe(2)
  })
})
