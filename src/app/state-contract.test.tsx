import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import HeaderCounts from '@/components/commerce/HeaderCounts'
import { resetStores } from '@/test/resetStores'
import type { Product } from '@/entities/product/model/product'
import HomePage from './page'
import ProductListView from './products/ProductListView'

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

// 응답은 실제 Response로 만든다. 부분 객체를 캐스팅하면 본문 파싱 경로가 실물과 달라진다.
// Response는 본문을 한 번만 읽을 수 있어서 호출마다 새로 만든다.
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status })

const stubCommerceApi = (listOverrides: Partial<typeof listPayload> = {}) => {
  const list = { ...listPayload, ...listOverrides }
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const payload = String(input).startsWith('/api/home') ? homePayload : list
    return Promise.resolve(jsonResponse(payload))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
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

beforeEach(() => {
  resetStores()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('홈과 목록과 헤더는 같은 store를 본다', () => {
  it('홈에서 담으면 목록의 같은 상품과 헤더 개수가 함께 바뀐다', async () => {
    stubCommerceApi()
    renderApp(
      <>
        <HeaderCounts />
        <HomePage />
        <ProductListView />
      </>,
    )

    // 홈과 목록이 다 뜬 다음에 조회한다. 상품A는 양쪽에 있어야 한다
    await screen.findByText('총 2개')
    await waitFor(() =>
      expect(screen.getAllByLabelText('상품A 장바구니')).toHaveLength(2),
    )
    const cartButtons = screen.getAllByLabelText('상품A 장바구니')

    fireEvent.click(cartButtons[0])

    cartButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByText('장바구니 1')).toBeInTheDocument()
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument()
  })

  it('위시리스트 토글은 장바구니 개수에 영향을 주지 않는다', async () => {
    stubCommerceApi()
    renderApp(
      <>
        <HeaderCounts />
        <HomePage />
      </>,
    )

    fireEvent.click(await screen.findByLabelText('상품B 위시리스트'))

    expect(screen.getByText('위시리스트 1')).toBeInTheDocument()
    expect(screen.getByText('장바구니 0')).toBeInTheDocument()
  })
})

describe('요청 실패는 전용 화면과 상황에 맞는 출구를 가진다', () => {
  it('목록 실패 시 에러 화면을 보여주고, 재시도가 성공하면 목록으로 복귀한다', async () => {
    // 첫 요청만 500, 재시도부터 성공하는 스텁
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockImplementation(() => Promise.resolve(jsonResponse(listPayload)))
    vi.stubGlobal('fetch', fetchMock)

    renderApp(<ProductListView />)

    expect(
      await screen.findByText('상품 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('총 2개')).toBeInTheDocument()
  })

  it('홈 실패 시 에러 화면과 재시도 버튼을 보여준다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(new Response(null, { status: 500 })),
      ),
    )

    renderApp(<HomePage />)

    expect(
      await screen.findByText('홈 데이터를 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })

  it('조건이 거절되면 서버 메시지를 보여주고 재시도 대신 조건 초기화를 준다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse({ message: '요청 조건을 확인해주세요.' }, 400),
        ),
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
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '검색 조건 초기화' }))
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    expect(lastUrlUpdate(onUrlUpdate).queryString).toBe('')
  })

  it('되돌릴 조건이 없으면 초기화 대신 화면 밖으로 나가는 길을 준다', async () => {
    // 조건이 이미 기본값이면 초기화해도 query key가 그대로라 아무 일도 일어나지 않는다.
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse({ message: '요청 조건을 확인해주세요.' }, 400),
        ),
      ),
    )

    renderApp(<ProductListView />)

    expect(
      await screen.findByText('요청 조건을 확인해주세요.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: '검색 조건 초기화' }),
    ).toBeNull()
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

describe('목록 조건의 원본은 URL이다', () => {
  it('URL의 조건이 화면과 API 요청에 그대로 나타난다', async () => {
    const fetchMock = stubCommerceApi()
    renderApp(<ProductListView />, {
      searchParams: '?category=digital&sort=popular&page=2',
    })

    await screen.findByText('총 2개')

    expect(screen.getByLabelText('카테고리')).toHaveValue('digital')
    expect(screen.getByLabelText('정렬')).toHaveValue('popular')

    const requestedUrl = String(fetchMock.mock.calls[0][0])
    expect(requestedUrl).toContain('category=digital')
    expect(requestedUrl).toContain('sort=popular')
    expect(requestedUrl).toContain('page=2')
  })

  it('잘못된 URL 조건은 화면과 API 요청 모두 기본값으로 수렴한다', async () => {
    const fetchMock = stubCommerceApi()
    renderApp(<ProductListView />, {
      searchParams: '?category=unknown&sort=cheapest&page=1.5',
    })

    await screen.findByText('총 2개')

    expect(screen.getByLabelText('카테고리')).toHaveValue('all')
    expect(screen.getByLabelText('정렬')).toHaveValue('latest')
    const requestedUrl = String(fetchMock.mock.calls[0][0])
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

    await screen.findByText('총 2개')
    fireEvent.change(screen.getByLabelText('카테고리'), {
      target: { value: 'casual' },
    })

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

    await screen.findByText(/없는 페이지/)
    fireEvent.click(screen.getByRole('button', { name: '1페이지로 이동' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    // page=1은 기본값이라 URL에서 제거된다
    expect(lastUrlUpdate(onUrlUpdate).searchParams.get('page')).toBeNull()
  })

  it('결과가 정말 없을 때만 조건 불일치 문구를 보여준다', async () => {
    stubCommerceApi({ products: [], totalCount: 0 })
    renderApp(<ProductListView />)

    expect(
      await screen.findByText('조건에 맞는 상품이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('검색을 제출해야 URL에 반영된다. 입력 중에는 로컬에 머문다', async () => {
    stubCommerceApi()
    const onUrlUpdate = vi.fn()
    renderApp(<ProductListView />, { onUrlUpdate })

    await screen.findByText('총 2개')
    const input = screen.getByLabelText('검색')

    fireEvent.change(input, { target: { value: '가디건' } })
    expect(onUrlUpdate).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '검색' }))
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const updated = lastUrlUpdate(onUrlUpdate).searchParams
    expect(updated.get('q')).toBe('가디건')
  })
})
