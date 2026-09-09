import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useCartStore } from '@/entities/cart/model/CartStore'
import type {
  Product,
  ProductListResponse,
} from '@/entities/product/model/types'

import {
  renderProductListHarness,
  resetProductListHarnessState,
} from '../../../../tests/helpers/renderProductListHarness'
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

describe('ProductList interactions', () => {
  beforeEach(resetProductListHarnessState)
  afterEach(resetProductListHarnessState)

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

    renderProductListHarness({ searchParams: '?page=2', withHeader: true })
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

    renderProductListHarness({ searchParams: '?page=2', withHeader: true })
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
    renderProductListHarness({ withHeader: true })

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

    renderProductListHarness({ withHeader: true })
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

    renderProductListHarness({ withHeader: true })
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
    renderProductListHarness({ withHeader: true })
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
