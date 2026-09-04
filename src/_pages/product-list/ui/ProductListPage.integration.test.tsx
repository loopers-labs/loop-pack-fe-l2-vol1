import '@/test/setup/msw'
import { HttpResponse, delay, http } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState, type JSX } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { UrlUpdateEvent } from 'nuqs/adapters/testing'
import { ProductListPage } from '@/_pages/product-list'
import { trackCartAdd, trackProductListView } from '@/analytics/events'
import {
  defaultProductListResponse,
  testProducts,
} from '@/test/fixtures/products'
import { server } from '@/test/mocks/server'
import { renderProductList } from '@/test/renderProductList'

vi.mock('@/analytics/events', () => ({
  trackCartAdd: vi.fn(),
  trackProductListView: vi.fn(),
}))

const PRODUCTS_ENDPOINT = 'http://localhost:3000/api/products'
const mockedTrackCartAdd = vi.mocked(trackCartAdd)
const mockedTrackProductListView = vi.mocked(trackProductListView)

interface AnalyticsRenderOptions {
  strictMode?: boolean
}

function RerenderableProductListPage(): JSX.Element {
  const [, setRevision] = useState(0)

  return (
    <>
      <button type="button" onClick={() => setRevision((value) => value + 1)}>
        Rerender product list
      </button>
      <ProductListPage />
    </>
  )
}

function renderAnalyticsProductList({
  strictMode = false,
}: AnalyticsRenderOptions = {}): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const page = <RerenderableProductListPage />

  render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter hasMemory>
        {strictMode ? <StrictMode>{page}</StrictMode> : page}
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  )
}

function UrlDrivenProductList(): JSX.Element {
  const [searchParams, setSearchParams] = useState('')

  return (
    <>
      <button
        type="button"
        onClick={() => setSearchParams('?category=fashion')}
      >
        패션 URL로 이동
      </button>
      <button type="button" onClick={() => setSearchParams('?q=fail')}>
        실패 URL로 이동
      </button>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory>
        <ProductListPage />
      </NuqsTestingAdapter>
    </>
  )
}

function renderUrlDrivenProductList(): {
  queryClient: QueryClient
  user: ReturnType<typeof userEvent.setup>
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <UrlDrivenProductList />
    </QueryClientProvider>,
  )

  return { queryClient, user: userEvent.setup() }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('product list analytics', () => {
  it('does not duplicate a list event after an ordinary rerender', async () => {
    renderAnalyticsProductList()
    await screen.findByRole('heading', {
      name: defaultProductListResponse.products[0].name,
    })

    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledExactlyOnceWith({
        category: 'all',
        sort: 'latest',
        page: 1,
      })
    })

    screen.getByRole('button', { name: 'Rerender product list' }).click()

    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledOnce()
    })
  })

  it('does not duplicate a list event during StrictMode effect replay', async () => {
    renderAnalyticsProductList({ strictMode: true })
    await screen.findByRole('heading', {
      name: defaultProductListResponse.products[0].name,
    })

    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledExactlyOnceWith({
        category: 'all',
        sort: 'latest',
        page: 1,
      })
    })
  })

  it('records valid displayed conditions once despite a background refetch', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({
          ...defaultProductListResponse,
          totalCount: 24,
          page: 2,
          pageSize: 12,
        }),
      ),
    )
    const { queryClient } = renderProductList({
      searchParams: '?q=shirt&category=fashion&sort=price-desc&page=2',
    })

    await screen.findByRole('heading', {
      name: defaultProductListResponse.products[0].name,
    })
    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledWith({
        category: 'fashion',
        sort: 'price-desc',
        page: 2,
      })
    })

    await queryClient.invalidateQueries()

    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledOnce()
    })
  })

  it('records the default displayed condition once', async () => {
    renderProductList()
    await screen.findByRole('heading', {
      name: defaultProductListResponse.products[0].name,
    })

    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledExactlyOnceWith({
        category: 'all',
        sort: 'latest',
        page: 1,
      })
    })
  })

  it('records the scenario error condition once after the final error UI appears', async () => {
    let requestedScenario: string | null = null
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        requestedScenario = new URL(request.url).searchParams.get('scenario')
        return HttpResponse.json(
          { message: '상품 목록을 불러오지 못했습니다.' },
          { status: 500 },
        )
      }),
    )

    renderProductList({ searchParams: '?scenario=error' })

    expect(
      await screen.findByText('상품 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(requestedScenario).toBe('error')
    expect(mockedTrackProductListView).toHaveBeenCalledExactlyOnceWith({
      category: 'all',
      sort: 'latest',
      page: 1,
    })
  })

  it('does not duplicate the scenario error event when the request is retried', async () => {
    let requestCount = 0
    server.use(
      http.get(PRODUCTS_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json(
          { message: '상품 목록을 불러오지 못했습니다.' },
          { status: 500 },
        )
      }),
    )

    const { user } = renderProductList({ searchParams: '?scenario=error' })
    const retryButton = await screen.findByRole('button', {
      name: '다시 시도',
    })

    await user.click(retryButton)

    await waitFor(() => {
      expect(requestCount).toBe(2)
    })
    expect(mockedTrackProductListView).toHaveBeenCalledExactlyOnceWith({
      category: 'all',
      sort: 'latest',
      page: 1,
    })
  })

  it('records one new view for each changed category, sort, page, or search condition', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        return HttpResponse.json({
          ...defaultProductListResponse,
          products: [testProducts[0]],
          totalCount: 24,
          page,
          pageSize: 12,
        })
      }),
    )
    const { user } = renderProductList()
    await screen.findByRole('heading', { name: testProducts[0].name })

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'fashion')
    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledTimes(2)
    })

    await user.selectOptions(screen.getAllByRole('combobox')[1], 'price-asc')
    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledTimes(3)
    })

    const paginationButtons = screen
      .getByRole('navigation')
      .querySelectorAll('button')
    await user.click(paginationButtons[paginationButtons.length - 1])
    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledTimes(4)
    })

    await user.type(screen.getByRole('textbox'), 'shirt')
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledTimes(5)
    })
    expect(mockedTrackProductListView).toHaveBeenLastCalledWith({
      category: 'fashion',
      sort: 'price-asc',
      page: 1,
    })
  })

  it('records an out-of-range page only after the displayed page is corrected', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        return HttpResponse.json({
          ...defaultProductListResponse,
          products: page > 2 ? [] : [testProducts[1]],
          totalCount: 24,
          page,
          pageSize: 12,
        })
      }),
    )

    renderProductList({ searchParams: '?page=99' })

    await screen.findByRole('heading', { name: testProducts[1].name })
    await waitFor(() => {
      expect(mockedTrackProductListView).toHaveBeenCalledExactlyOnceWith({
        category: 'all',
        sort: 'latest',
        page: 2,
      })
    })
  })
})

describe('상품 목록 상태', () => {
  it('지연된 성공 응답 전에는 로딩 상태를 유지하고 이후 상품을 표시한다', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, async () => {
        await delay(100)
        return HttpResponse.json(defaultProductListResponse)
      }),
    )

    const { container } = renderProductList()

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(
      screen.queryByText('전체 · 최신순 조건에 맞는 상품이 0개입니다.'),
    ).not.toBeInTheDocument()

    expect(
      await screen.findByRole('heading', {
        name: defaultProductListResponse.products[0].name,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('총 3개')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it('필터 갱신 중에는 이전 목록을 유지하고 최초 로딩 상태와 구분한다', async () => {
    const updatedProduct = {
      ...testProducts[1],
      id: 'fashion-only',
      name: '패션 전용 상품',
    }
    server.use(
      http.get(PRODUCTS_ENDPOINT, async ({ request }) => {
        if (new URL(request.url).searchParams.get('category') === 'fashion') {
          await delay(100)
          return HttpResponse.json({
            ...defaultProductListResponse,
            products: [updatedProduct],
            totalCount: 1,
          })
        }
        return HttpResponse.json(defaultProductListResponse)
      }),
    )
    const { container, user } = renderProductList()
    const firstProduct = defaultProductListResponse.products[0]
    const results = screen.getByRole('region', { name: '상품 검색 결과' })

    expect(results).toHaveAttribute('aria-busy', 'true')
    await screen.findByRole('heading', { name: firstProduct.name })
    expect(results).toHaveAttribute('aria-busy', 'false')

    await user.selectOptions(
      screen.getByRole('combobox', { name: '카테고리' }),
      'fashion',
    )

    expect(await screen.findByRole('status')).toHaveTextContent(
      '목록을 갱신하는 중입니다…',
    )
    expect(results).toHaveAttribute('aria-busy', 'false')
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(
      screen.getByRole('heading', { name: firstProduct.name }),
    ).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: updatedProduct.name }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: firstProduct.name }),
    ).not.toBeInTheDocument()
  })

  it('URL로 이동한 직전 성공 목록을 다음 갱신 실패 때 유지한다', async () => {
    const initialProduct = { ...testProducts[0], name: '최초 URL 상품' }
    const fashionProduct = { ...testProducts[1], name: '패션 URL 상품' }
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const params = new URL(request.url).searchParams
        if (params.get('q') === 'fail') {
          return HttpResponse.json(
            { message: '목록을 불러오지 못했습니다.' },
            { status: 500 },
          )
        }
        const product =
          params.get('category') === 'fashion' ? fashionProduct : initialProduct
        return HttpResponse.json({
          ...defaultProductListResponse,
          products: [product],
          totalCount: 1,
        })
      }),
    )
    const { queryClient, user } = renderUrlDrivenProductList()

    await screen.findByRole('heading', { name: initialProduct.name })
    await user.click(screen.getByRole('button', { name: '패션 URL로 이동' }))
    await screen.findByRole('heading', { name: fashionProduct.name })
    queryClient.setQueryData(['products', { prefetched: true }], {
      ...defaultProductListResponse,
      products: [{ ...testProducts[2], name: '화면에 표시하지 않은 상품' }],
      totalCount: 1,
    })
    await user.click(screen.getByRole('button', { name: '실패 URL로 이동' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      '목록을 갱신하지 못했습니다. 아래는 직전 결과입니다.',
    )
    expect(
      screen.getByRole('heading', { name: fashionProduct.name }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: initialProduct.name }),
    ).not.toBeInTheDocument()
  })

  it('빈 성공 응답은 0개 상태로 표시하고 상품과 페이지 이동을 숨긴다', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({
          ...defaultProductListResponse,
          products: [],
          totalCount: 0,
        }),
      ),
    )

    renderProductList()

    expect(
      await screen.findByText('전체 · 최신순 조건에 맞는 상품이 0개입니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('총 0개')).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: '페이지 이동' }),
    ).not.toBeInTheDocument()
  })

  it('최초 요청 실패는 목록 대신 오류와 다시 시도를 표시한다', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json(
          { message: '상품 목록을 불러오지 못했습니다.' },
          { status: 500 },
        ),
      ),
    )

    renderProductList()

    expect(
      await screen.findByText('상품 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('필터 갱신 실패는 직전 목록과 인라인 오류를 함께 유지한다', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const category = new URL(request.url).searchParams.get('category')
        if (category === 'fashion') {
          return HttpResponse.json(
            { message: '상품 목록을 불러오지 못했습니다.' },
            { status: 500 },
          )
        }
        return HttpResponse.json(defaultProductListResponse)
      }),
    )
    const { user } = renderProductList()
    const firstProduct = defaultProductListResponse.products[0]
    await screen.findByRole('heading', { name: firstProduct.name })

    await user.selectOptions(
      screen.getByRole('combobox', { name: '카테고리' }),
      'fashion',
    )

    expect(
      await screen.findByText(
        '목록을 갱신하지 못했습니다. 아래는 직전 결과입니다.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: firstProduct.name }),
    ).toBeInTheDocument()
  })

  it('오류에서 다시 시도하면 중복 요청을 막고 성공 목록으로 복구한다', async () => {
    let requestCount = 0
    server.use(
      http.get(PRODUCTS_ENDPOINT, async () => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json(
            { message: '상품 목록을 불러오지 못했습니다.' },
            { status: 500 },
          )
        }
        await delay(100)
        return HttpResponse.json(defaultProductListResponse)
      }),
    )
    const { user } = renderProductList()
    const retryButton = await screen.findByRole('button', {
      name: '다시 시도',
    })

    await user.click(retryButton)

    const retryingButton = screen.getByRole('button', { name: '재시도 중…' })
    expect(retryingButton).toBeDisabled()
    await user.click(retryingButton)
    expect(requestCount).toBe(2)
    expect(
      await screen.findByRole('heading', {
        name: defaultProductListResponse.products[0].name,
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('상품 목록을 불러오지 못했습니다.'),
    ).not.toBeInTheDocument()
    expect(requestCount).toBe(2)
  })
})

describe('상품 목록 조작', () => {
  it('초기 URL 조건을 필터와 요청 및 현재 페이지로 복원한다', async () => {
    let requestedUrl: URL | undefined
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        requestedUrl = new URL(request.url)
        return HttpResponse.json({
          ...defaultProductListResponse,
          products: [testProducts[1]],
          totalCount: 24,
          page: 2,
          pageSize: 12,
        })
      }),
    )

    renderProductList({
      searchParams: '?q=니트&category=fashion&sort=price-desc&page=2',
    })

    await screen.findByRole('heading', { name: testProducts[1].name })
    expect(screen.getByRole('textbox', { name: '검색' })).toHaveValue('니트')
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveValue(
      'fashion',
    )
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'price-desc',
    )
    expect(
      screen.getByRole('button', { name: '2', current: 'page' }),
    ).toBeDisabled()
    expect(requestedUrl?.searchParams.get('q')).toBe('니트')
    expect(requestedUrl?.searchParams.get('category')).toBe('fashion')
    expect(requestedUrl?.searchParams.get('sort')).toBe('price-desc')
    expect(requestedUrl?.searchParams.get('page')).toBe('2')
  })

  it('카테고리를 바꾸면 1페이지 조건으로 요청하고 새 목록을 표시한다', async () => {
    const requestedUrls: string[] = []
    const urlUpdates: UrlUpdateEvent[] = []
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        requestedUrls.push(request.url)
        const params = new URL(request.url).searchParams
        const isFashion = params.get('category') === 'fashion'
        return HttpResponse.json({
          ...defaultProductListResponse,
          products: [isFashion ? testProducts[1] : testProducts[0]],
          totalCount: 1,
          page: Number(params.get('page')),
        })
      }),
    )
    const { user } = renderProductList({
      searchParams: '?page=2',
      onUrlUpdate: (event) => urlUpdates.push(event),
    })
    await screen.findByRole('heading', { name: testProducts[0].name })

    await user.selectOptions(
      screen.getByRole('combobox', { name: '카테고리' }),
      'fashion',
    )

    expect(
      await screen.findByRole('heading', { name: testProducts[1].name }),
    ).toBeInTheDocument()
    const lastRequest = new URL(requestedUrls.at(-1) ?? '')
    expect(lastRequest.searchParams.get('category')).toBe('fashion')
    expect(lastRequest.searchParams.get('sort')).toBe('latest')
    expect(lastRequest.searchParams.get('page')).toBe('1')
    const lastUrlUpdate = urlUpdates.at(-1)
    expect(lastUrlUpdate?.searchParams.get('category')).toBe('fashion')
    expect(lastUrlUpdate?.searchParams.get('page')).toBeNull()
    expect(lastUrlUpdate?.searchParams.get('sort')).toBeNull()
    expect(lastUrlUpdate?.options.history).toBe('push')
    expect(
      screen.queryByRole('heading', { name: testProducts[0].name }),
    ).not.toBeInTheDocument()
  })

  it('낮은 가격순을 고르면 요청 조건과 고정 응답 순서를 화면에 반영한다', async () => {
    const requestedUrls: string[] = []
    const ascendingProducts = [
      testProducts[1],
      testProducts[0],
      testProducts[2],
    ]
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        requestedUrls.push(request.url)
        const params = new URL(request.url).searchParams
        return HttpResponse.json({
          ...defaultProductListResponse,
          products:
            params.get('sort') === 'price-asc'
              ? ascendingProducts
              : [...testProducts],
          page: Number(params.get('page')),
        })
      }),
    )
    const { user } = renderProductList({ searchParams: '?page=2' })
    await screen.findByRole('heading', { name: testProducts[0].name })

    await user.selectOptions(
      screen.getByRole('combobox', { name: '정렬' }),
      'price-asc',
    )

    await screen.findByRole('heading', { name: ascendingProducts[0].name })
    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(ascendingProducts.map((product) => product.name))
    const lastRequest = new URL(requestedUrls.at(-1) ?? '')
    expect(lastRequest.searchParams.get('sort')).toBe('price-asc')
    expect(lastRequest.searchParams.get('page')).toBe('1')
    expect(lastRequest.searchParams.get('pageSize')).toBe('12')
  })

  it('다음 페이지로 이동하면 새 목록과 마지막 페이지 상태를 표시한다', async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        return HttpResponse.json({
          ...defaultProductListResponse,
          products: [page === 2 ? testProducts[2] : testProducts[0]],
          totalCount: 24,
          page,
          pageSize: 12,
        })
      }),
    )
    const { user } = renderProductList()
    await screen.findByRole('heading', { name: testProducts[0].name })

    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(
      await screen.findByRole('heading', { name: testProducts[2].name }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '2', current: 'page' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('실제 상품을 다시 누르면 헤더 개수가 돌아오고 두 상품은 독립적으로 더해진다', async () => {
    const { user } = renderProductList({ includeHeader: true })
    const firstCartButton = await screen.findByRole('button', {
      name: `${testProducts[0].name} 장바구니`,
    })
    const secondCartButton = screen.getByRole('button', {
      name: `${testProducts[1].name} 장바구니`,
    })

    await user.click(firstCartButton)
    expect(mockedTrackCartAdd).toHaveBeenCalledExactlyOnceWith({
      productId: testProducts[0].id,
      quantity: 1,
    })
    expect(screen.getByText('장바구니 1')).toBeInTheDocument()
    expect(firstCartButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(firstCartButton)
    expect(screen.getByText('장바구니 0')).toBeInTheDocument()
    expect(firstCartButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(firstCartButton)
    await user.click(secondCartButton)
    expect(screen.getByText('장바구니 2')).toBeInTheDocument()
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument()
  })
})
