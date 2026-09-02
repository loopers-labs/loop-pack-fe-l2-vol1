import '@/test/setup/msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { act, render, screen, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { JSX } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartCount, useCartIds, useToggleCart } from '@/entities/cart'
import { LogoutButton } from '@/features/auth'
import { setProtectedRequestNavigationForTest } from '@/shared/api/protectedHttpClient'
import { server } from '@/test/mocks/server'
import { CreateOrderButton } from './CreateOrderButton'

const ORDERS_ENDPOINT = 'http://localhost:3000/api/orders'
const FIRST_PRODUCT_ID = 'p1'
const SECOND_PRODUCT_ID = 'p2'

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

function CartControls(): JSX.Element {
  const cartCount = useCartCount()
  const cartIds = useCartIds()
  const toggleCart = useToggleCart()

  return (
    <>
      <output data-testid="cart-count">{cartCount}</output>
      <output data-testid="cart-ids">{cartIds.join(',')}</output>
      <button type="button" onClick={() => toggleCart(FIRST_PRODUCT_ID)}>
        첫 번째 상품 담기
      </button>
      <button type="button" onClick={() => toggleCart(SECOND_PRODUCT_ID)}>
        두 번째 상품 담기
      </button>
    </>
  )
}

interface RenderCreateOrderResult extends RenderResult {
  user: UserEvent
}

function renderCreateOrder(includeLogout = false): RenderCreateOrderResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <CartControls />
        <CreateOrderButton />
        {includeLogout && <LogoutButton />}
      </QueryClientProvider>,
    ),
  }
}

describe('CreateOrderButton', () => {
  let restoreProtectedNavigation: (() => void) | undefined

  beforeEach(() => {
    router.push.mockReset()
    router.refresh.mockReset()
    window.history.replaceState(null, '', '/checkout')
  })

  afterEach(() => {
    restoreProtectedNavigation?.()
    restoreProtectedNavigation = undefined
    window.history.replaceState(null, '', '/')
  })

  it('빈 장바구니에서는 주문을 막고 빈 상태를 안내한다', () => {
    renderCreateOrder()

    expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled()
    expect(screen.getByText('장바구니가 비어 있습니다.')).toBeInTheDocument()
  })

  it('장바구니 ID를 수량 1의 주문 항목으로 보내고 성공 후 장바구니를 비운 뒤 주문 내역으로 이동한다', async () => {
    let requestBody: unknown
    server.use(
      http.post(ORDERS_ENDPOINT, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          {
            order: {
              id: 'o1',
              createdAt: '2026-09-02T12:00:00.000Z',
              items: [
                { productId: FIRST_PRODUCT_ID, quantity: 1 },
                { productId: SECOND_PRODUCT_ID, quantity: 1 },
              ],
            },
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderCreateOrder()

    await user.click(screen.getByRole('button', { name: '첫 번째 상품 담기' }))
    await user.click(screen.getByRole('button', { name: '두 번째 상품 담기' }))
    await user.click(screen.getByRole('button', { name: '주문하기' }))

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/orders')
    })
    expect(requestBody).toEqual({
      items: [
        { productId: FIRST_PRODUCT_ID, quantity: 1 },
        { productId: SECOND_PRODUCT_ID, quantity: 1 },
      ],
    })
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
  })

  it.each([400, 500])(
    '%i 응답이면 장바구니를 보존하고 서버 메시지를 표시한다',
    async (status) => {
      server.use(
        http.post(ORDERS_ENDPOINT, () =>
          HttpResponse.json(
            { message: '주문을 처리할 수 없습니다.' },
            { status },
          ),
        ),
      )
      const { user } = renderCreateOrder()

      await user.click(
        screen.getByRole('button', { name: '첫 번째 상품 담기' }),
      )
      await user.click(screen.getByRole('button', { name: '주문하기' }))

      expect(
        await screen.findByText('주문을 처리할 수 없습니다.'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      expect(router.push).not.toHaveBeenCalled()
    },
  )

  it('401 응답 처리를 보호 요청 경계에 맡기고 장바구니와 현재 화면을 유지한다', async () => {
    const navigations: string[] = []
    restoreProtectedNavigation = setProtectedRequestNavigationForTest((url) => {
      navigations.push(url)
    })
    server.use(
      http.post(ORDERS_ENDPOINT, () =>
        HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
      ),
    )
    const { user } = renderCreateOrder()

    await user.click(screen.getByRole('button', { name: '첫 번째 상품 담기' }))
    await user.click(screen.getByRole('button', { name: '주문하기' }))

    await vi.waitFor(() => {
      expect(navigations).toEqual([
        '/login?reason=expired&returnTo=%2Fcheckout',
      ])
    })
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('주문 요청 중에는 중복 제출을 막는다', async () => {
    let requestCount = 0
    let resolveOrder: ((response: Response) => void) | undefined
    server.use(
      http.post(ORDERS_ENDPOINT, () => {
        requestCount += 1
        return new Promise<Response>((resolve) => {
          resolveOrder = resolve
        })
      }),
    )
    const { user } = renderCreateOrder()

    await user.click(screen.getByRole('button', { name: '첫 번째 상품 담기' }))
    await user.click(screen.getByRole('button', { name: '주문하기' }))

    const pendingButton = screen.getByRole('button', { name: '주문 중' })
    expect(pendingButton).toBeDisabled()
    await user.click(pendingButton)
    expect(requestCount).toBe(1)

    if (resolveOrder === undefined) {
      throw new Error('Order response resolver was not initialized.')
    }
    resolveOrder(
      HttpResponse.json(
        {
          order: {
            id: 'o1',
            createdAt: '2026-09-02T12:00:00.000Z',
            items: [{ productId: FIRST_PRODUCT_ID, quantity: 1 }],
          },
        },
        { status: 201 },
      ),
    )

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/orders')
    })
  })

  it('요청 중 주문 화면이 다시 마운트되어도 동일 주문을 다시 제출하지 않는다', async () => {
    let requestCount = 0
    let releaseOrder: (() => void) | undefined
    const orderGate = new Promise<void>((resolve) => {
      releaseOrder = resolve
    })
    server.use(
      http.post(ORDERS_ENDPOINT, async () => {
        requestCount += 1
        await orderGate
        return HttpResponse.json(
          {
            order: {
              id: 'o1',
              createdAt: '2026-09-02T12:00:00.000Z',
              items: [{ productId: FIRST_PRODUCT_ID, quantity: 1 }],
            },
          },
          { status: 201 },
        )
      }),
    )
    const firstRender = renderCreateOrder()
    await firstRender.user.click(
      screen.getByRole('button', { name: '첫 번째 상품 담기' }),
    )
    await firstRender.user.click(
      screen.getByRole('button', { name: '주문하기' }),
    )
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })

    firstRender.unmount()
    const secondRender = renderCreateOrder()

    try {
      const pendingButton = screen.getByRole('button', { name: '주문 중' })
      expect(pendingButton).toBeDisabled()
      await secondRender.user.click(pendingButton)
      expect(requestCount).toBe(1)
    } finally {
      releaseOrder?.()
    }

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledOnce()
    })
  })

  it('요청 중 새로 담은 상품은 이전 주문 성공 시 장바구니에 남긴다', async () => {
    let requestCount = 0
    let releaseOrder: (() => void) | undefined
    const orderGate = new Promise<void>((resolve) => {
      releaseOrder = resolve
    })
    server.use(
      http.post(ORDERS_ENDPOINT, async () => {
        requestCount += 1
        await orderGate
        return HttpResponse.json(
          {
            order: {
              id: 'o1',
              createdAt: '2026-09-02T12:00:00.000Z',
              items: [{ productId: FIRST_PRODUCT_ID, quantity: 1 }],
            },
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderCreateOrder()
    await user.click(screen.getByRole('button', { name: '첫 번째 상품 담기' }))
    await user.click(screen.getByRole('button', { name: '주문하기' }))
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })

    await user.click(screen.getByRole('button', { name: '두 번째 상품 담기' }))
    expect(screen.getByTestId('cart-ids')).toHaveTextContent('p1,p2')
    releaseOrder?.()

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/orders')
    })
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('cart-ids')).toHaveTextContent('p2')
  })

  it('제출한 상품을 제거한 뒤 같은 ID를 다시 담아도 이전 주문 성공이 새 항목을 지우지 않는다', async () => {
    let requestCount = 0
    let releaseOrder: (() => void) | undefined
    const orderGate = new Promise<void>((resolve) => {
      releaseOrder = resolve
    })
    server.use(
      http.post(ORDERS_ENDPOINT, async () => {
        requestCount += 1
        await orderGate
        return HttpResponse.json(
          {
            order: {
              id: 'o1',
              createdAt: '2026-09-02T12:00:00.000Z',
              items: [{ productId: FIRST_PRODUCT_ID, quantity: 1 }],
            },
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderCreateOrder()
    const firstProductButton = screen.getByRole('button', {
      name: '첫 번째 상품 담기',
    })
    await user.click(firstProductButton)
    await user.click(screen.getByRole('button', { name: '주문하기' }))
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })

    await user.click(firstProductButton)
    await user.click(firstProductButton)
    expect(screen.getByTestId('cart-ids')).toHaveTextContent('p1')
    releaseOrder?.()

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/orders')
    })
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('cart-ids')).toHaveTextContent('p1')
  })

  it('요청 중 다시 마운트된 버튼이 실패 메시지를 받고 재시도할 때 이전 오류를 지운다', async () => {
    let requestCount = 0
    let releaseFirstOrder: (() => void) | undefined
    let releaseRetryOrder: (() => void) | undefined
    const firstOrderGate = new Promise<void>((resolve) => {
      releaseFirstOrder = resolve
    })
    const retryOrderGate = new Promise<void>((resolve) => {
      releaseRetryOrder = resolve
    })
    server.use(
      http.post(ORDERS_ENDPOINT, async () => {
        requestCount += 1

        if (requestCount === 1) {
          await firstOrderGate
          return HttpResponse.json(
            { message: '다시 마운트된 화면에 표시할 오류입니다.' },
            { status: 500 },
          )
        }

        await retryOrderGate
        return HttpResponse.json(
          {
            order: {
              id: 'o2',
              createdAt: '2026-09-02T12:01:00.000Z',
              items: [{ productId: FIRST_PRODUCT_ID, quantity: 1 }],
            },
          },
          { status: 201 },
        )
      }),
    )
    const firstRender = renderCreateOrder()
    await firstRender.user.click(
      screen.getByRole('button', { name: '첫 번째 상품 담기' }),
    )
    await firstRender.user.click(
      screen.getByRole('button', { name: '주문하기' }),
    )
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })

    firstRender.unmount()
    const secondRender = renderCreateOrder()

    try {
      releaseFirstOrder?.()
      expect(
        await screen.findByText('다시 마운트된 화면에 표시할 오류입니다.'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')

      await secondRender.user.click(
        screen.getByRole('button', { name: '주문하기' }),
      )
      expect(
        screen.queryByText('다시 마운트된 화면에 표시할 오류입니다.'),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '주문 중' })).toBeDisabled()
      await vi.waitFor(() => {
        expect(requestCount).toBe(2)
      })
      releaseRetryOrder?.()

      await vi.waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/orders')
      })
      expect(
        screen.queryByText('다시 마운트된 화면에 표시할 오류입니다.'),
      ).not.toBeInTheDocument()
    } finally {
      releaseFirstOrder?.()
      releaseRetryOrder?.()
    }
  })

  it('로그아웃으로 인증 경계가 바뀌면 이전 주문 요청의 성공 부수 효과를 막는다', async () => {
    let orderRequestCount = 0
    let orderRequestSignal: AbortSignal | undefined
    let releaseOrder: (() => void) | undefined
    let markOrderHandlerReturned: (() => void) | undefined
    const orderGate = new Promise<void>((resolve) => {
      releaseOrder = resolve
    })
    const orderHandlerReturned = new Promise<void>((resolve) => {
      markOrderHandlerReturned = resolve
    })
    server.use(
      http.post(ORDERS_ENDPOINT, async ({ request }) => {
        orderRequestCount += 1
        orderRequestSignal = request.signal
        await orderGate
        markOrderHandlerReturned?.()
        return HttpResponse.json(
          {
            order: {
              id: 'old-session-order',
              createdAt: '2026-09-02T12:00:00.000Z',
              items: [{ productId: FIRST_PRODUCT_ID, quantity: 1 }],
            },
          },
          { status: 201 },
        )
      }),
      http.post(
        'http://localhost:3000/api/auth/logout',
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    const { user } = renderCreateOrder(true)
    await user.click(screen.getByRole('button', { name: '첫 번째 상품 담기' }))
    await user.click(screen.getByRole('button', { name: '주문하기' }))
    await vi.waitFor(() => {
      expect(orderRequestCount).toBe(1)
    })

    try {
      await user.click(screen.getByRole('button', { name: '로그아웃' }))
      await vi.waitFor(() => {
        expect(router.refresh).toHaveBeenCalledOnce()
      })
      expect(orderRequestSignal?.aborted).toBe(true)

      await act(async () => {
        releaseOrder?.()
        await orderHandlerReturned
        await Promise.resolve()
      })

      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      expect(screen.getByTestId('cart-ids')).toHaveTextContent('p1')
      expect(router.push).not.toHaveBeenCalled()
    } finally {
      releaseOrder?.()
    }
  })
})
