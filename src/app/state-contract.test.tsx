import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import HeaderCounts from '@/components/commerce/HeaderCounts'
import { useShoppingStore } from '@/stores/shopping'
import type { Product } from '@/types/commerce'
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

const stubCommerceApi = () => {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    const payload = url.startsWith('/api/home') ? homePayload : listPayload
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(payload),
    } as Response)
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
  useShoppingStore.setState({ cartIds: [], wishlistIds: [] })
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

  it('검색을 제출해야 URL에 반영된다. 입력 중에는 로컬에 머문다', async () => {
    stubCommerceApi()
    const onUrlUpdate = vi.fn()
    renderApp(<ProductListView />, { onUrlUpdate })

    await screen.findByText('총 2개')
    const input = screen.getByLabelText('검색')

    fireEvent.change(input, { target: { value: '가디건' } })
    expect(onUrlUpdate).not.toHaveBeenCalled()

    fireEvent.submit(input.closest('form') as HTMLFormElement)
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const updated = lastUrlUpdate(onUrlUpdate).searchParams
    expect(updated.get('q')).toBe('가디건')
  })
})
