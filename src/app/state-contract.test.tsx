import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import { Header } from '@/widgets/header'
import { server } from '@/test/msw/server'
import type { Product } from '@/entities/product/model/product'
import { HomeContent } from '@/_pages/home'
import { ProductListView } from '@/_pages/product-list'

// 구현이 아니라 사용자에게 보이는 상태 계약을 검증한다.
// 홈과 목록이 같은 store를 보는지, URL 조건이 화면과 요청에 일치하는지.

const makeProduct = (id: string, name: string): Product => ({
  id,
  brand: '브랜드',
  name,
  category: 'casual',
  price: 10000,
  originalPrice: null,
  image: `/images/products/${id}.jpg`,
  freeShipping: false,
  sizes: [],
  rating: 4.5,
  reviewCount: 10,
  createdAt: '2026-07-01T00:00:00.000Z',
})

const productA = makeProduct('p1', '상품A')
const productB = makeProduct('p2', '상품B')

const homePayload = {
  banner: {
    title: '배너',
    description: '설명',
    image: '/images/products/p1.jpg',
  },
  categories: [{ id: 'casual', name: '캐주얼' }],
  popularProducts: [productA],
  newProducts: [productB],
}

const listPayload = {
  products: [productA, productB],
  categories: [{ id: 'casual', name: '캐주얼' }],
  totalCount: 2,
  page: 1,
  pageSize: 12,
}

// 응답은 MSW가 네트워크에서 만든다. 앱의 fetch는 그대로 두어야 URL 조립과 상태 코드
// 해석까지 검증 안에 남는다. 이 파일은 화면 계약이 대상이라 응답 본문을 직접 정한다.
const respondWithProducts = (
  resolver: Parameters<typeof http.get>[1],
): URL[] => {
  const requestedUrls: URL[] = []
  server.use(
    http.get('*/api/products', (info) => {
      requestedUrls.push(new URL(info.request.url))
      return resolver(info)
    }),
  )
  return requestedUrls
}

const respondWithHome = (resolver: Parameters<typeof http.get>[1]) => {
  server.use(http.get('*/api/home', resolver))
}

const stubCommerceApi = (listOverrides: Partial<typeof listPayload> = {}) => {
  const list = { ...listPayload, ...listOverrides }
  respondWithHome(() => HttpResponse.json(homePayload))
  return respondWithProducts(() => HttpResponse.json(list))
}

const lastUrlUpdate = (spy: ReturnType<typeof vi.fn>): UrlUpdateEvent => {
  const lastCall = spy.mock.calls.at(-1)
  if (!lastCall) throw new Error('URL 업데이트가 발생하지 않았다')
  return lastCall[0] as UrlUpdateEvent
}

interface RenderAppOptions {
  searchParams?: string
  onUrlUpdate?: (event: UrlUpdateEvent) => void
}

const renderApp = (
  ui: React.ReactNode,
  { searchParams = '', onUrlUpdate }: RenderAppOptions = {},
) => {
  // 테스트마다 새 QueryClient. 캐시가 테스트 사이로 새면 순서에 따라 결과가 달라진다.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NuqsTestingAdapter>,
  )
}

describe('홈과 목록과 헤더는 같은 store를 본다', () => {
  it('알려진 카테고리는 storefront 영문명을 쓰고 새 카테고리는 서버 이름을 보존한다', async () => {
    const payload = {
      ...homePayload,
      categories: [
        { id: 'casual', name: '캐주얼' },
        { id: 'new-category', name: '새 카테고리' },
      ],
    }
    respondWithHome(() => HttpResponse.json(payload))

    renderApp(<HomeContent />)

    expect(await screen.findByRole('link', { name: 'Casual' })).toHaveAttribute(
      'href',
      '/products?category=casual',
    )
    expect(screen.getByRole('link', { name: '새 카테고리' })).toHaveAttribute(
      'href',
      '/products?category=new-category',
    )
  })

  it('홈에서 담으면 목록의 같은 상품과 헤더 개수가 함께 바뀐다', async () => {
    stubCommerceApi()
    renderApp(
      <>
        <Header />
        <HomeContent />
        <ProductListView />
      </>,
    )

    // 홈과 목록이 다 뜬 다음에 조회한다. 상품A는 양쪽에 있어야 한다
    await screen.findByText('2 products')
    await waitFor(() =>
      expect(screen.getAllByLabelText('상품A bag')).toHaveLength(2),
    )
    const cartButtons = screen.getAllByLabelText('상품A bag')

    fireEvent.click(cartButtons[0])

    cartButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByText('Bag 1')).toBeInTheDocument()
    expect(screen.getByText('Wishlist 0')).toBeInTheDocument()
  })

  it('위시리스트 토글은 장바구니 개수에 영향을 주지 않는다', async () => {
    stubCommerceApi()
    renderApp(
      <>
        <Header />
        <HomeContent />
      </>,
    )

    fireEvent.click(await screen.findByLabelText('상품B wishlist'))

    expect(screen.getByText('Wishlist 1')).toBeInTheDocument()
    expect(screen.getByText('Bag 0')).toBeInTheDocument()
  })
})

describe('요청 실패는 전용 화면과 상황에 맞는 출구를 가진다', () => {
  it('목록 실패 시 에러 화면을 보여주고, 재시도가 성공하면 목록으로 복귀한다', async () => {
    // 첫 요청만 500, 재시도부터 성공한다.
    let attempts = 0
    respondWithProducts(() => {
      attempts += 1
      return attempts === 1
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json(listPayload)
    })

    renderApp(<ProductListView />)

    expect(
      await screen.findByText('Could not load products.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('2 products')).toBeInTheDocument()
  })

  it('목록 조회가 실패해도 조건을 바꿀 수 있는 UI는 화면에 남는다', async () => {
    // Decision 6의 핵심이다. 조회 실패를 Error Boundary로 올리면 필터까지 사라져
    // 사용자가 조건을 바꿔 벗어날 길이 닫힌다. 그래서 결과 영역 안에서 처리한다.
    respondWithProducts(() => new HttpResponse(null, { status: 500 }))
    const onUrlUpdate = vi.fn()

    renderApp(<ProductListView />, { onUrlUpdate })

    await screen.findByText('Could not load products.')

    expect(screen.getByLabelText('Search')).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /Category/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Sort/ })).toBeInTheDocument()

    // 남아 있기만 한 것이 아니라 조작되어야 한다.
    fireEvent.click(screen.getByRole('combobox', { name: /Category/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Digital' }))
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    expect(lastUrlUpdate(onUrlUpdate).searchParams.get('category')).toBe(
      'digital',
    )
  })

  it('홈 실패 시 에러 화면과 재시도 버튼을 보여준다', async () => {
    respondWithHome(() => new HttpResponse(null, { status: 500 }))

    renderApp(<HomeContent />)

    expect(await screen.findByText('Could not load home.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('조건이 거절되면 서버 메시지를 보여주고 재시도 대신 조건 초기화를 준다', async () => {
    respondWithProducts(() =>
      HttpResponse.json(
        { message: '요청 조건을 확인해주세요.' },
        { status: 400 },
      ),
    )
    const onUrlUpdate = vi.fn()

    renderApp(<ProductListView />, {
      searchParams: '?category=casual&page=3',
      onUrlUpdate,
    })

    // 화면이 정한 기본 문구가 아니라 서버가 보낸 메시지를 보여준다.
    expect(
      await screen.findByText('요청 조건을 확인해주세요.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    expect(lastUrlUpdate(onUrlUpdate).queryString).toBe('')
  })

  it('되돌릴 조건이 없으면 초기화 대신 화면 밖으로 나가는 길을 준다', async () => {
    // 조건이 이미 기본값이면 초기화해도 query key가 그대로라 아무 일도 일어나지 않는다.
    respondWithProducts(() =>
      HttpResponse.json(
        { message: '요청 조건을 확인해주세요.' },
        { status: 400 },
      ),
    )

    renderApp(<ProductListView />)

    expect(
      await screen.findByText('요청 조건을 확인해주세요.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset filters' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

describe('목록 조건의 원본은 URL이다', () => {
  it('URL의 조건이 화면과 API 요청에 그대로 나타난다', async () => {
    const requestedUrls = stubCommerceApi()
    renderApp(<ProductListView />, {
      searchParams: '?category=digital&sort=popular&page=2',
    })

    await screen.findByText('2 products')

    expect(
      screen.getByRole('combobox', { name: /Category/ }),
    ).toHaveTextContent('Digital')
    expect(screen.getByRole('combobox', { name: /Sort/ })).toHaveTextContent(
      'Popular',
    )

    const requestedUrl = requestedUrls[0].search
    expect(requestedUrl).toContain('category=digital')
    expect(requestedUrl).toContain('sort=popular')
    expect(requestedUrl).toContain('page=2')
  })

  it('잘못된 URL 조건은 화면과 API 요청 모두 기본값으로 수렴한다', async () => {
    const requestedUrls = stubCommerceApi()
    renderApp(<ProductListView />, {
      searchParams: '?category=unknown&sort=cheapest&page=1.5',
    })

    await screen.findByText('2 products')

    expect(
      screen.getByRole('combobox', { name: /Category/ }),
    ).toHaveTextContent('All')
    expect(screen.getByRole('combobox', { name: /Sort/ })).toHaveTextContent(
      'Newest',
    )
    const requestedUrl = requestedUrls[0].search
    expect(requestedUrl).toContain('category=all')
    expect(requestedUrl).toContain('sort=latest')
    expect(requestedUrl).toContain('page=1')
  })

  it('카테고리를 바꾸면 page는 1로 돌아가고 검색어는 유지된다', async () => {
    stubCommerceApi()
    const onUrlUpdate = vi.fn()
    renderApp(<ProductListView />, {
      searchParams: '?q=니트&page=3',
      onUrlUpdate,
    })

    await screen.findByText('2 products')
    fireEvent.click(screen.getByRole('combobox', { name: /Category/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Casual' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const updated = lastUrlUpdate(onUrlUpdate).searchParams
    expect(updated.get('category')).toBe('casual')
    expect(updated.get('q')).toBe('니트')
    // page=1은 기본값이라 URL에서 사라진다. 3이 남아있으면 안 된다
    expect(updated.get('page')).toBeNull()
  })

  it('범위 밖 페이지는 빈 결과가 아니라 출구가 있는 안내를 보여준다', async () => {
    stubCommerceApi({ products: [], totalCount: 2, page: 99 })
    const onUrlUpdate = vi.fn()
    renderApp(<ProductListView />, { searchParams: '?page=99', onUrlUpdate })

    await screen.findByText(/does not exist/)
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 1' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    // page=1은 기본값이라 URL에서 제거된다
    expect(lastUrlUpdate(onUrlUpdate).searchParams.get('page')).toBeNull()
  })

  it('결과가 정말 없을 때만 0건 문구를 보여준다', async () => {
    stubCommerceApi({ products: [], totalCount: 0 })
    renderApp(<ProductListView />)

    // 걸어둔 조건이 없으므로 필터를 언급하지 않는다.
    expect(
      await screen.findByText('No products are available.'),
    ).toBeInTheDocument()
  })

  it('검색을 제출해야 URL에 반영된다. 입력 중에는 로컬에 머문다', async () => {
    stubCommerceApi()
    const onUrlUpdate = vi.fn()
    renderApp(<ProductListView />, { onUrlUpdate })

    await screen.findByText('2 products')
    const input = screen.getByLabelText('Search')

    fireEvent.change(input, { target: { value: '가디건' } })
    expect(onUrlUpdate).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const updated = lastUrlUpdate(onUrlUpdate).searchParams
    expect(updated.get('q')).toBe('가디건')
  })
})
