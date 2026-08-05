import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { Product } from '@/entities/product/model/product'
import { resetStores } from '@/test/resetStores'
import { PRODUCT_PAGE_SIZE } from '../model/searchParams'
import ProductListView from './ProductListView'

// 조건을 바꾸는 동안 사용자가 무엇을 보는지 고정한다.
// 응답을 직접 잡고 있어야 "기다리는 중"의 화면을 검사할 수 있어서 fetch를 수동으로 푼다.

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

const pageResponse = (page: number, products: Product[]) => ({
  products,
  categories: [{ id: 'casual', name: '캐주얼' }],
  totalCount: 30,
  page,
  pageSize: 12,
})

// 호출마다 resolve를 밖으로 꺼내 둔다. 응답 시점을 테스트가 정한다.
const deferredFetch = () => {
  const pending: Array<(body: unknown) => void> = []
  const fetchMock = vi.fn<typeof fetch>(
    () =>
      new Promise<Response>((resolve) => {
        pending.push((body) => resolve(new Response(JSON.stringify(body))))
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return {
    settle: (body: unknown) => {
      const next = pending.shift()
      if (!next) throw new Error('대기 중인 요청이 없다')
      next(body)
    },
    callCount: () => fetchMock.mock.calls.length,
  }
}

// 테스트 어댑터는 초기 searchParams만 읽는다. 그래서 조건이 바뀐 뒤의 최종 화면은
// 그 조건으로 새로 마운트해 확인하고, 전환 중 화면은 클릭 직후에 확인한다.
const renderView = (searchParams = '') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <QueryClientProvider client={queryClient}>
        <ProductListView />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  )
  return queryClient
}

const resultsRegion = () =>
  screen.getByRole('region', { name: 'Product results' })

// 갱신 안내는 결과 영역 밖의 live region이 맡는다. busy 영역 안에 두면 알림이
// 완료까지 미뤄질 수 있고, 그때는 문구가 이미 사라져 끝내 읽히지 않는다.
const liveRegion = () => screen.getByRole('status')

beforeEach(() => {
  resetStores()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('조건을 바꾸는 동안의 목록', () => {
  it('보여줄 데이터가 없는 최초 진입은 올 목록만큼 자리를 잡는다', () => {
    deferredFetch()

    renderView()

    // 텍스트 한 줄이 아니라 실제 목록과 같은 수의 카드 자리를 예약한다.
    expect(document.querySelectorAll('.week05-grid')).toHaveLength(1)
    expect(document.querySelectorAll('.week05-product')).toHaveLength(
      PRODUCT_PAGE_SIZE,
    )
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull()
  })

  it('빈 상자를 훑게 하지 않고 기다리는 중이라는 사실만 전한다', () => {
    deferredFetch()

    renderView()

    expect(document.querySelector('.week05-grid')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(liveRegion()).toHaveTextContent('Loading products.')
    expect(resultsRegion()).toHaveAttribute('aria-busy', 'true')
  })

  it('이전 목록이 있으면 갱신 중에도 목록과 페이지네이션을 유지한다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    expect(await screen.findByText('1페이지 상품')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // 목록이 사라지지 않는다. 이것이 이 변경의 핵심이다.
    await waitFor(() => expect(api.callCount()).toBe(2))
    expect(screen.getByText('1페이지 상품')).toBeInTheDocument()
    expect(screen.queryByText('Loading products…')).toBeNull()
    expect(resultsRegion()).toHaveAttribute('aria-busy', 'true')
  })

  it('갱신 중에는 보이는 목록이 이전 조건의 결과임을 밝힌다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(api.callCount()).toBe(2))

    // 화면에는 개수 행 안에서 짧게, 보조 기술에는 무엇을 보고 있는지 문장으로.
    expect(screen.getByText(/Updating…/)).toBeInTheDocument()
    expect(liveRegion()).toHaveTextContent(
      'Updating results. The current list shows the previous selection.',
    )
  })

  it('같은 조건을 다시 가져오는 동안에도 갱신 중임을 알린다', async () => {
    const api = deferredFetch()
    const queryClient = renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    // 조건이 그대로라 placeholder가 아니다. 그래도 사용자는 갱신 중임을 알아야 한다.
    void queryClient.invalidateQueries({ queryKey: ['products'] })

    await waitFor(() => expect(api.callCount()).toBe(2))
    expect(screen.getByText(/Updating…/)).toBeInTheDocument()
    expect(liveRegion()).toHaveTextContent('Updating results.')
    expect(liveRegion()).not.toHaveTextContent('previous selection')
  })

  it('갱신 중 페이지 표기는 URL이 아니라 화면에 있는 응답을 따른다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(api.callCount()).toBe(2))

    // URL은 이미 page=2지만 화면의 상품은 1페이지다. 표기가 상품을 따라야 어긋나지 않는다.
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('갱신 중에는 페이지 이동을 막는다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(api.callCount()).toBe(2))

    // 보이는 것이 이전 페이지라 여기서 또 누르면 의도한 곳과 다른 페이지로 간다.
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('응답이 도착하면 표기와 상품과 조작이 새 조건으로 정리된다', async () => {
    const api = deferredFetch()
    renderView('?page=2')

    api.settle(pageResponse(2, [makeProduct('p13', '2페이지 상품')]))

    expect(await screen.findByText('2페이지 상품')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.queryByText(/Updating…/)).toBeNull()
    expect(liveRegion()).toHaveTextContent('')
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    expect(resultsRegion()).toHaveAttribute('aria-busy', 'false')
  })
})
