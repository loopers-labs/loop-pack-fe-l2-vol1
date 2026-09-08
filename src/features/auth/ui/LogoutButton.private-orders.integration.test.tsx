import '@/test/setup/msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, delay, http } from 'msw'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderListPage } from '@/_pages/orders'
import { server } from '@/test/mocks/server'
import { LogoutButton } from './LogoutButton'

const LOGOUT_ENDPOINT = 'http://localhost:3000/api/auth/logout'
const ORDERS_ENDPOINT = 'http://localhost:3000/api/orders'
const CREATED_AT = '2026-09-02T12:00:00.000Z'

const router = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function privateSessionView(
  queryClient: QueryClient,
  showOrders: boolean,
): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <LogoutButton />
      {showOrders && <OrderListPage />}
    </QueryClientProvider>
  )
}

describe('LogoutButton private order isolation', () => {
  beforeEach(() => {
    router.refresh.mockReset()
  })

  it('removes user A cached orders before user B mounts the order screen', async () => {
    let activeUser: 'A' | 'B' = 'A'
    server.use(
      http.get(ORDERS_ENDPOINT, async () => {
        if (activeUser === 'B') {
          await delay(100)
        }

        return HttpResponse.json({
          orders: [
            {
              id: activeUser === 'A' ? 'order-a' : 'order-b',
              createdAt: CREATED_AT,
              items: [
                { productId: activeUser === 'A' ? 'p1' : 'p2', quantity: 1 },
              ],
            },
          ],
        })
      }),
      http.post(LOGOUT_ENDPOINT, () => {
        activeUser = 'B'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const queryClient = createQueryClient()
    const user = userEvent.setup()
    const view = render(privateSessionView(queryClient, true))
    await screen.findByText('주문 번호: order-a')

    view.rerender(privateSessionView(queryClient, false))
    await user.click(screen.getByRole('button', { name: '로그아웃' }))
    await vi.waitFor(() => {
      expect(router.refresh).toHaveBeenCalledOnce()
    })

    view.rerender(privateSessionView(queryClient, true))

    expect(screen.queryByText('주문 번호: order-a')).not.toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: '주문 내역 로딩' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('주문 번호: order-b')).toBeInTheDocument()
  })

  it('cancels user A in-flight orders so they cannot populate user B state', async () => {
    let requestCount = 0
    let releaseFirstRequest: (() => void) | undefined
    let markFirstHandlerReturned: (() => void) | undefined
    const firstRequestGate = new Promise<void>((resolve) => {
      releaseFirstRequest = resolve
    })
    const firstHandlerReturned = new Promise<void>((resolve) => {
      markFirstHandlerReturned = resolve
    })
    server.use(
      http.get(ORDERS_ENDPOINT, async () => {
        requestCount += 1
        if (requestCount === 1) {
          await firstRequestGate
          markFirstHandlerReturned?.()
          return HttpResponse.json({
            orders: [
              {
                id: 'order-a-in-flight',
                createdAt: CREATED_AT,
                items: [{ productId: 'p1', quantity: 1 }],
              },
            ],
          })
        }

        return HttpResponse.json({
          orders: [
            {
              id: 'order-b',
              createdAt: CREATED_AT,
              items: [{ productId: 'p2', quantity: 1 }],
            },
          ],
        })
      }),
      http.post(LOGOUT_ENDPOINT, () => new HttpResponse(null, { status: 204 })),
    )
    const queryClient = createQueryClient()
    const user = userEvent.setup()
    const view = render(privateSessionView(queryClient, true))
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })

    view.rerender(privateSessionView(queryClient, false))
    await user.click(screen.getByRole('button', { name: '로그아웃' }))
    await vi.waitFor(() => {
      expect(router.refresh).toHaveBeenCalledOnce()
    })
    view.rerender(privateSessionView(queryClient, true))

    try {
      await vi.waitFor(() => {
        expect(requestCount).toBe(2)
      })
      expect(await screen.findByText('주문 번호: order-b')).toBeInTheDocument()

      await act(async () => {
        releaseFirstRequest?.()
        await firstHandlerReturned
      })

      expect(
        screen.queryByText('주문 번호: order-a-in-flight'),
      ).not.toBeInTheDocument()
      expect(screen.getByText('주문 번호: order-b')).toBeInTheDocument()
    } finally {
      releaseFirstRequest?.()
    }
  })
})
