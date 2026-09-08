import '@/test/setup/msw'
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { HttpResponse, delay, http } from 'msw'
import {
  render,
  screen,
  within,
  type RenderResult,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PRIVATE_ORDER_QUERY_KEY } from '@/entities/order'
import { setProtectedRequestNavigationForTest } from '@/shared/api/protectedHttpClient'
import { server } from '@/test/mocks/server'
import { OrderListPage } from './OrderListPage'

const ORDERS_ENDPOINT = 'http://localhost:3000/api/orders'
const FIRST_CREATED_AT = '2026-09-02T12:00:00.000Z'

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderOrderList(queryClient = createQueryClient()): RenderResult {
  const content: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <OrderListPage />
    </QueryClientProvider>
  )

  return render(content)
}

describe('OrderListPage', () => {
  let restoreProtectedNavigation: (() => void) | undefined

  beforeEach(() => {
    window.history.replaceState(null, '', '/orders')
  })

  afterEach(() => {
    onlineManager.setOnline(true)
    restoreProtectedNavigation?.()
    restoreProtectedNavigation = undefined
    window.history.replaceState(null, '', '/')
  })

  it('주문 내역을 기다리는 동안 접근 가능한 로딩 상태를 제공한다', () => {
    server.use(
      http.get(ORDERS_ENDPOINT, async () => {
        await delay(100)
        return HttpResponse.json({ orders: [] })
      }),
    )

    renderOrderList()

    expect(
      screen.getByRole('status', { name: '주문 내역 로딩' }),
    ).toHaveTextContent('주문 내역을 불러오는 중입니다.')
  })

  it('오프라인에서 첫 요청이 일시 정지되면 빈 주문이 아니라 로딩 상태를 제공한다', () => {
    onlineManager.setOnline(false)
    const queryClient = createQueryClient()
    const rendered = renderOrderList(queryClient)

    try {
      expect(
        screen.getByRole('status', { name: '주문 내역 로딩' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByText('주문 내역이 없습니다.'),
      ).not.toBeInTheDocument()
    } finally {
      rendered.unmount()
      queryClient.clear()
      onlineManager.setOnline(true)
    }
  })

  it('캐시가 있어도 오프라인 재검증이 정지된 재마운트에서는 이전 주문을 숨긴다', async () => {
    server.use(
      http.get(ORDERS_ENDPOINT, () =>
        HttpResponse.json({
          orders: [
            {
              id: 'o-paused-stale',
              createdAt: FIRST_CREATED_AT,
              items: [{ productId: 'p1', quantity: 1 }],
            },
          ],
        }),
      ),
    )
    const queryClient = createQueryClient()
    const firstRender = renderOrderList(queryClient)
    await screen.findByText('주문 번호: o-paused-stale')

    firstRender.unmount()
    onlineManager.setOnline(false)
    const pausedRender = renderOrderList(queryClient)

    try {
      expect(
        screen.queryByText('주문 번호: o-paused-stale'),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('status', { name: '주문 내역 로딩' }),
      ).toBeInTheDocument()
      expect(
        queryClient.getQueryState(PRIVATE_ORDER_QUERY_KEY)?.fetchStatus,
      ).toBe('paused')
    } finally {
      pausedRender.unmount()
      queryClient.clear()
      onlineManager.setOnline(true)
    }
  })

  it('주문이 없으면 명시적인 빈 상태를 보여준다', async () => {
    server.use(
      http.get(ORDERS_ENDPOINT, () => HttpResponse.json({ orders: [] })),
    )

    renderOrderList()

    expect(await screen.findByText('주문 내역이 없습니다.')).toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: '주문 내역' }),
    ).not.toBeInTheDocument()
  })

  it('주문과 상품을 의미 있는 목록으로 렌더링한다', async () => {
    server.use(
      http.get(ORDERS_ENDPOINT, () =>
        HttpResponse.json({
          orders: [
            {
              id: 'o1',
              createdAt: FIRST_CREATED_AT,
              items: [
                { productId: 'p1', quantity: 1 },
                { productId: 'p2', quantity: 2 },
              ],
            },
          ],
        }),
      ),
    )

    renderOrderList()

    const orderList = await screen.findByRole('list', { name: '주문 내역' })
    const order = within(orderList).getByRole('article', { name: '주문 o1' })
    expect(within(order).getByText('주문 번호: o1')).toBeInTheDocument()
    expect(within(order).getByText(FIRST_CREATED_AT)).toHaveAttribute(
      'datetime',
      FIRST_CREATED_AT,
    )
    const itemList = within(order).getByRole('list', {
      name: '주문 o1 상품 목록',
    })
    const items = within(itemList).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('상품 ID: p1')
    expect(items[0]).toHaveTextContent('수량: 1')
    expect(items[1]).toHaveTextContent('상품 ID: p2')
    expect(items[1]).toHaveTextContent('수량: 2')
  })

  it.each([400, 500])('%i 응답이면 API 메시지를 보여준다', async (status) => {
    server.use(
      http.get(ORDERS_ENDPOINT, () =>
        HttpResponse.json(
          { message: '주문 내역을 불러올 수 없습니다.' },
          { status },
        ),
      ),
    )

    renderOrderList()

    expect(
      await screen.findByText('주문 내역을 불러올 수 없습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: '주문 내역' }),
    ).not.toBeInTheDocument()
  })

  it('401은 보호 요청 경계가 처리하고 이전 성공 데이터를 숨긴다', async () => {
    let sessionExpired = false
    let releaseExpiredResponse: (() => void) | undefined
    const expiredResponseGate = new Promise<void>((resolve) => {
      releaseExpiredResponse = resolve
    })
    const navigations: string[] = []
    restoreProtectedNavigation = setProtectedRequestNavigationForTest((url) => {
      navigations.push(url)
    })
    server.use(
      http.get(ORDERS_ENDPOINT, async () => {
        if (sessionExpired) {
          await expiredResponseGate
          return HttpResponse.json(
            { message: '로그인이 필요합니다.' },
            { status: 401 },
          )
        }

        return HttpResponse.json({
          orders: [
            {
              id: 'o-stale',
              createdAt: FIRST_CREATED_AT,
              items: [{ productId: 'p1', quantity: 1 }],
            },
          ],
        })
      }),
    )
    const queryClient = createQueryClient()
    const firstRender = renderOrderList(queryClient)
    await screen.findByText('주문 번호: o-stale')

    firstRender.unmount()
    sessionExpired = true
    renderOrderList(queryClient)

    try {
      expect(screen.queryByText('주문 번호: o-stale')).not.toBeInTheDocument()
      expect(
        screen.getByRole('status', { name: '주문 내역 로딩' }),
      ).toBeInTheDocument()
      releaseExpiredResponse?.()

      await vi.waitFor(() => {
        expect(navigations).toEqual([
          '/login?reason=expired&returnTo=%2Forders',
        ])
      })
      expect(screen.queryByText('주문 번호: o-stale')).not.toBeInTheDocument()
    } finally {
      releaseExpiredResponse?.()
    }
  })
})
