import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useCartStore } from '@/entities/cart/model/CartStore'
import { ProductService } from '@/entities/product/api/ProductService'
import { ProductListRouteParams } from '@/entities/product/model/ProductListRouteParams'
import type {
  Product,
  ProductListResponse,
} from '@/entities/product/model/types'
import { useWishlistStore } from '@/entities/wishlist/model/WishlistStore'
import { useProductFilters } from '@/features/product-filter/model/useProductFilters'
import { FilterBar } from '@/features/product-filter/ui/FilterBar'
import { useProductListState } from '@/views/product-list/model/useProductListState'
import { Header } from '@/widgets/header/ui/Header'
import { ProductListSection } from '@/widgets/product-list/ui/ProductListSection'

import { server } from '../../../../tests/setup/mswServer'

const productDefaults: Omit<
  Product,
  'id' | 'name' | 'category' | 'price' | 'image'
> = {
  brand: 'Loopers',
  originalPrice: null,
  freeShipping: true,
  sizes: [{ value: 1, stock: 5 }],
  rating: 4.2,
  reviewCount: 1,
  createdAt: '2026-08-10T00:00:00.000Z',
}

const products = {
  casual: {
    ...productDefaults,
    id: 'p-casual',
    name: '캐주얼 첫 페이지 상품',
    category: 'casual',
    price: 20_000,
    image: '/images/casual.webp',
  },
  cheap: {
    ...productDefaults,
    id: 'p-cheap',
    name: '저가 정렬 상품',
    category: 'home',
    price: 10_000,
    image: '/images/cheap.webp',
  },
  expensive: {
    ...productDefaults,
    id: 'p-expensive',
    name: '고가 정렬 상품',
    category: 'home',
    price: 90_000,
    image: '/images/expensive.webp',
  },
  pageOne: {
    ...productDefaults,
    id: 'p-page-one',
    name: '첫 페이지 상품',
    category: 'home',
    price: 10_000,
    image: '/images/one.webp',
  },
  pageTwo: {
    ...productDefaults,
    id: 'p-page-two',
    name: '두 번째 페이지 상품',
    category: 'home',
    price: 20_000,
    image: '/images/two.webp',
  },
} satisfies Record<string, ProductListResponse['products'][number]>

const productList = (
  listedProducts: ProductListResponse['products'],
  totalCount = listedProducts.length,
  page = 1,
): ProductListResponse => ({
  products: listedProducts,
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
    <>
      <Header />
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
    </>
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

const resetTestState = () => {
  activeQueryClient?.clear()
  activeQueryClient = undefined
  localStorage.clear()
  useCartStore.setState({ items: {} })
  useWishlistStore.setState({ items: {} })
}

describe('ProductList interactions', () => {
  beforeEach(resetTestState)
  afterEach(resetTestState)

  it('Product list category filter - when the category changes from page two - resets to page one and shows matching products', async () => {
    // Arrange
    const user = userEvent.setup()
    const requestedPages: Array<string> = []
    server.use(
      http.get('http://localhost:3000/api/products', ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        requestedPages.push(searchParams.get('page') ?? '')
        return HttpResponse.json(
          searchParams.get('category') === 'casual' &&
            searchParams.get('page') === '1'
            ? productList([products.casual])
            : productList([products.pageTwo], 24, 2),
        )
      }),
    )

    renderProductList('?page=2')
    await screen.findByRole('heading', { name: products.pageTwo.name })

    // Act
    await user.selectOptions(screen.getByLabelText('카테고리'), 'casual')

    // Assert
    await screen.findByRole('heading', { name: products.casual.name })
    expect(requestedPages).toEqual(['2', '1'])
    expect(
      screen.queryByRole('heading', { name: products.pageTwo.name }),
    ).not.toBeInTheDocument()
  })

  it('Product list sorting - when the sort changes from page two - resets to page one and shows the selected order', async () => {
    // Arrange
    const user = userEvent.setup()
    const requestedPages: Array<string> = []
    server.use(
      http.get('http://localhost:3000/api/products', ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        requestedPages.push(searchParams.get('page') ?? '')
        return HttpResponse.json(
          searchParams.get('sort') === 'price-desc' &&
            searchParams.get('page') === '1'
            ? productList([products.expensive, products.cheap])
            : productList([products.pageTwo], 24, 2),
        )
      }),
    )

    renderProductList('?page=2')
    await screen.findByRole('heading', { name: products.pageTwo.name })

    // Act
    await user.selectOptions(screen.getByLabelText('정렬'), 'price-desc')

    // Assert
    await screen.findByRole('heading', { name: products.expensive.name })
    const resultRegion = screen.getByRole('region', { name: '상품 검색 결과' })
    expect(
      within(resultRegion)
        .getAllByRole('heading', { level: 3 })
        .map(({ textContent }) => textContent),
    ).toEqual([products.expensive.name, products.cheap.name])
    expect(requestedPages).toEqual(['2', '1'])
  })

  it('Product list pagination - on the first page - disables the previous button', async () => {
    // Arrange
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productList([products.pageOne], 24)),
      ),
    )

    // Act
    renderProductList()

    // Assert
    await screen.findByRole('heading', { name: products.pageOne.name })
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  })

  it('Product list pagination - when the shopper moves to the final page - replaces the previous product and disables the next button', async () => {
    // Arrange
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:3000/api/products', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        return HttpResponse.json(
          page === '2'
            ? productList([products.pageTwo], 24, 2)
            : productList([products.pageOne], 24),
        )
      }),
    )

    renderProductList()
    await screen.findByRole('heading', { name: products.pageOne.name })

    // Act
    await user.click(screen.getByRole('button', { name: '다음' }))

    // Assert
    await screen.findByRole('heading', { name: products.pageTwo.name })
    expect(
      screen.queryByRole('heading', { name: products.pageOne.name }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('Product list cart control - when a product is added - updates the Header count to one', async () => {
    // Arrange
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productList([products.pageOne])),
      ),
    )

    renderProductList()
    await screen.findByRole('heading', { name: products.pageOne.name })
    const cartButton = screen.getByRole('button', {
      name: `${products.pageOne.name} 장바구니`,
    })

    // Act
    await user.click(cartButton)

    // Assert
    expect(screen.getByLabelText('장바구니 1개')).toBeInTheDocument()
  })

  it('Product list cart control - when a product is removed - updates the Header count to zero', async () => {
    // Arrange
    const user = userEvent.setup()
    useCartStore.setState({ items: { [products.pageOne.id]: true } })
    server.use(
      http.get('http://localhost:3000/api/products', () =>
        HttpResponse.json(productList([products.pageOne])),
      ),
    )
    renderProductList()
    await screen.findByRole('heading', { name: products.pageOne.name })
    const cartButton = screen.getByRole('button', {
      name: `${products.pageOne.name} 장바구니`,
    })

    // Act
    await user.click(cartButton)

    // Assert
    expect(screen.getByLabelText('장바구니 0개')).toBeInTheDocument()
  })
})
