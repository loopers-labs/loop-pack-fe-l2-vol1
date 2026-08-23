import { beforeEach, describe, expect, it } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react'
import type { Product } from '@/entities/product/model/product'
import { deferredGet } from '@/test/msw/deferredGet'
import { resetStores } from '@/test/resetStores'
import { PRODUCT_PAGE_SIZE } from '../model/searchParams'
import ProductListView from './ProductListView'

// 조건을 바꾸는 동안 사용자가 무엇을 보는지 고정한다.
// "기다리는 중"의 화면을 보려면 응답 시점을 쥐고 있어야 한다. 앱의 fetch를 바꿔치기하는
// 대신 MSW 핸들러가 응답을 붙들고 있게 해서, 요청은 평소처럼 나가고 전송 계층도 그대로 돈다.

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

// 0건도 성공 응답이다. 범위 밖 페이지와 갈리도록 totalCount도 0으로 둔다.
const emptyResponse = () => ({
  products: [],
  categories: [{ id: 'casual', name: '캐주얼' }],
  totalCount: 0,
  page: 1,
  pageSize: 12,
})

// 응답 시점을 테스트가 정한다. 요청은 실제로 나가고 MSW가 잡는다.
const deferredFetch = () => {
  const api = deferredGet('*/api/products')
  return {
    ...api,
    requestedPages: () =>
      api.requestedUrls.map((url) => url.searchParams.get('page')),
  }
}

// 테스트 어댑터가 아니라 jsdom의 실제 history를 쓰는 어댑터를 쓴다.
// 테스트 어댑터는 초기 searchParams만 읽어서 조건을 바꾼 뒤의 화면까지 갈 수 없다.
// 갱신 실패는 조건이 바뀐 채로 유지돼야 관찰할 수 있는 상태다.
const renderView = (searchParams = '') => {
  window.history.replaceState(null, '', `/products${searchParams}`)
  // 어댑터는 popstate로 URL을 다시 읽는다. 이 신호가 없으면 앞 테스트의 조건이 남는다.
  window.dispatchEvent(new PopStateEvent('popstate'))
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ProductListView />
      </QueryClientProvider>
    </NuqsAdapter>,
  )
  return queryClient
}

const resultsRegion = () =>
  screen.getByRole('region', { name: 'Product results' })

// 갱신 안내는 결과 영역 밖의 live region이 맡는다. busy 영역 안에 두면 알림이
// 완료까지 미뤄질 수 있고, 그때는 문구가 이미 사라져 끝내 읽히지 않는다.
const liveRegion = () => screen.getByRole('status')

// URL이 실제로 새 조건으로 바뀐 뒤를 기다린다. 어댑터가 갱신을 잠깐 모으기 때문에
// 고정 시간 대기 대신 관찰 가능한 상태로 동기를 맞춘다.
const goneToPageTwo = () =>
  waitFor(() => expect(window.location.search).toContain('page=2'))

// 초기 URL에서도 통과하지 않도록 바뀐 값 자체를 기다린다.
const searchedForKnit = () =>
  waitFor(() =>
    expect(decodeURIComponent(window.location.search)).toContain('q=니트'),
  )

beforeEach(() => {
  resetStores()
  // URL은 문서 하나를 공유한다. 앞 테스트가 남긴 조건이 다음 테스트의 시작점이 되지 않게 한다.
  window.history.replaceState(null, '', '/products')
  window.dispatchEvent(new PopStateEvent('popstate'))
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
    await goneToPageTwo()

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
    await goneToPageTwo()
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
    await goneToPageTwo()
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
    await goneToPageTwo()
    await waitFor(() => expect(api.callCount()).toBe(2))

    // 보이는 것이 이전 페이지라 여기서 또 누르면 의도한 곳과 다른 페이지로 간다.
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('0건도 개수와 조건을 성공 경로와 같은 자리에서 보여준다', async () => {
    const api = deferredFetch()
    renderView('?q=니트&category=goods&sort=popular')

    api.settle(emptyResponse())

    expect(await screen.findByText('0 products')).toBeInTheDocument()
    expect(
      screen.getByText(
        'No products match “니트” in Beauty & Goods, sorted by Popular.',
      ),
    ).toBeInTheDocument()
    // 조건이 있으니 되돌릴 것이 있다.
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeEnabled()
    expect(document.querySelectorAll('.product-result-notice')).toHaveLength(1)
  })

  it('조건이 전부 기본값인 0건에는 되돌릴 것이 없다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(emptyResponse())

    expect(
      await screen.findByText('No products are available.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset filters' })).toBeNull()
  })

  it('응답을 기다리는 동안에도 0건 설명은 보이는 목록의 조건을 가리킨다', async () => {
    const api = deferredFetch()
    renderView('?q=셔츠')

    api.settle(emptyResponse())
    await screen.findByText('No products match “셔츠”.')

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: '니트' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await searchedForKnit()
    await waitFor(() => expect(api.callCount()).toBe(2))

    // 니트 요청은 아직 끝나지 않았다. 0건인지 확인된 적이 없다.
    expect(screen.getByText('No products match “셔츠”.')).toBeInTheDocument()
    expect(within(resultsRegion()).queryByText(/니트/)).toBeNull()
    expect(screen.getByText(/Updating…/)).toBeInTheDocument()
    expect(liveRegion()).toHaveTextContent(
      'Updating results. The current list shows the previous selection.',
    )

    // 니트가 실제로 0건으로 끝난 뒤에야 니트 설명으로 바뀐다.
    api.settle(emptyResponse())
    expect(
      await screen.findByText('No products match “니트”.'),
    ).toBeInTheDocument()
  })

  it('0건 설명은 실패한 새 조건이 아니라 보이는 목록의 조건을 가리킨다', async () => {
    const api = deferredFetch()
    renderView('?q=셔츠')

    api.settle(emptyResponse())
    await screen.findByText('No products match “셔츠”.')

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: '니트' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await searchedForKnit()
    await waitFor(() => expect(api.callCount()).toBe(2))
    api.fail()
    await screen.findByRole('button', { name: 'Try again' })

    // 니트 요청은 실패했으니 0건인지 확인된 적이 없다. 확인된 0건은 셔츠뿐이다.
    expect(screen.getByText('No products match “셔츠”.')).toBeInTheDocument()
    expect(screen.queryByText(/니트/)).toBeNull()
    // 실패한 것은 현재 URL 조건이고, URL은 그 조건을 유지한다.
    expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument()
    expect(decodeURIComponent(window.location.search)).toContain('q=니트')
  })

  it('검색어의 특수문자를 마크업이 아니라 글자로 보여준다', async () => {
    const api = deferredFetch()
    renderView('?q=<script>alert(1)</script>')

    api.settle(emptyResponse())

    // 문자열을 HTML로 조립하지 않는다. 텍스트 노드로만 남아야 한다.
    expect(await screen.findByText(/<script>/)).toBeInTheDocument()
    expect(document.body.querySelector('script')).toBeNull()
  })

  it('보여줄 목록이 없는 최초 실패는 목록 대신 오류와 재시도를 보여준다', async () => {
    const api = deferredFetch()
    renderView()

    api.fail()

    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
    expect(document.querySelectorAll('.week05-product')).toHaveLength(0)
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull()
  })

  it('갱신이 실패해도 직전에 보던 목록은 남는다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await goneToPageTwo()
    await waitFor(() => expect(api.callCount()).toBe(2))
    api.fail()
    await screen.findByRole('button', { name: 'Try again' })

    // 실패한 것은 page=2라는 새 캐시 항목이라 그쪽에는 데이터가 없다.
    // 직전 조건의 캐시를 꺼내 목록을 유지하는지가 이 변경의 핵심이다.
    expect(screen.getByText('1페이지 상품')).toBeInTheDocument()
    expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument()
    // 실패했다고 URL을 되돌리지 않는다. 사용자가 가려던 조건이 그대로 남아야
    // 재시도가 같은 곳을 다시 요청한다.
    expect(window.location.search).toContain('page=2')
    expect(liveRegion()).toHaveTextContent(
      'Could not update results. The current list shows the previous selection.',
    )
  })

  it('갱신 실패 중에는 표기가 이전 응답을 따르고 페이지 이동을 막는다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await goneToPageTwo()
    await waitFor(() => expect(api.callCount()).toBe(2))
    api.fail()
    await screen.findByRole('button', { name: 'Try again' })

    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('갱신 실패의 재시도는 실패한 현재 조건을 다시 요청한다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await goneToPageTwo()
    await waitFor(() => expect(api.callCount()).toBe(2))
    api.fail()
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    // 되돌아가는 것이 아니라 사용자가 가려던 조건을 다시 요청해야 한다.
    await waitFor(() => expect(api.callCount()).toBe(3))
    expect(api.requestedPages()).toEqual(['1', '2', '2'])

    // 다시 기다리는 동안에도 목록은 남아 있어야 한다.
    expect(screen.getByText('1페이지 상품')).toBeInTheDocument()
    expect(resultsRegion()).toHaveAttribute('aria-busy', 'true')
  })

  it('재시도가 성공하면 현재 조건의 목록으로 교체된다', async () => {
    const api = deferredFetch()
    renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await goneToPageTwo()
    await waitFor(() => expect(api.callCount()).toBe(2))
    api.fail()
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(api.callCount()).toBe(3))
    api.settle(pageResponse(2, [makeProduct('p13', '2페이지 상품')]))

    expect(await screen.findByText('2페이지 상품')).toBeInTheDocument()
    expect(screen.queryByText('1페이지 상품')).toBeNull()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
    expect(liveRegion()).toHaveTextContent('')
  })

  it('직전 목록이 캐시에서 사라졌으면 전체 오류 화면으로 떨어진다', async () => {
    const api = deferredFetch()
    const queryClient = renderView()

    api.settle(pageResponse(1, [makeProduct('p1', '1페이지 상품')]))
    await screen.findByText('1페이지 상품')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await goneToPageTwo()
    await waitFor(() => expect(api.callCount()).toBe(2))
    // 관찰자가 없어진 이전 항목은 gcTime이 지나면 사라진다. 그 상태를 앞당긴다.
    // 지금 관찰 중인 항목까지 지우면 쿼리가 새로 만들어져 실패 자체가 관찰되지 않는다.
    queryClient.removeQueries({
      predicate: (query) =>
        (query.state.data as { page?: number } | undefined)?.page === 1,
    })
    api.fail()

    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
    expect(document.querySelectorAll('.week05-product')).toHaveLength(0)
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
