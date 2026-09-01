import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    clear: () => {
      storage.clear()
    },
    getItem: (key: string) => storage.get(key) ?? null,
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
  })
})

import '@/analytics/client'

import { registerProviders } from '@/analytics/logger'
import { Providers } from '@/app/providers'
import { useCartStore } from '@/entities/cart/model/CartStore'

import { server } from '../../../../tests/setup/mswServer'
import { CheckoutView } from './CheckoutView'

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

type CapturedTrack = {
  readonly type: 'track'
  readonly event: string
  readonly properties: Record<string, unknown>
}

const calls: Array<CapturedTrack> = []

registerProviders([
  {
    name: 'capture',
    initialize() {},
    track: (event, properties) => {
      calls.push({ type: 'track', event, properties })
    },
    identify() {},
    reset() {},
  },
])

const tracked = (event: string) => calls.filter((call) => call.event === event)

function renderCheckout() {
  render(
    <Providers
      initialSession={{
        status: 'authenticated',
        user: {
          id: 'u1',
          name: '루퍼1',
          email: 'looper1@loopers.dev',
        },
      }}
    >
      <CheckoutView userId="u1" />
    </Providers>,
  )
}

afterEach(() => {
  calls.length = 0
  router.replace.mockReset()
  router.refresh.mockReset()
  useCartStore.setState({ items: {} })
})

describe('CheckoutView', () => {
  it('creates one order from the current cart and clears the purchased items', async () => {
    let requestBody: unknown
    server.use(
      http.post('http://localhost:3000/api/orders', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          {
            order: {
              id: 'o1',
              createdAt: '2026-09-01T00:00:00.000Z',
              items: [
                { productId: 'p1', quantity: 1 },
                { productId: 'p2', quantity: 1 },
              ],
            },
          },
          { status: 201 },
        )
      }),
    )
    useCartStore.setState({ items: { p1: true, p2: true } })
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(tracked('order_start')).toHaveLength(1)
    })
    expect(tracked('order_start')[0].properties).toMatchObject({
      itemCount: 2,
      productIds: ['p1', 'p2'],
    })

    await user.click(screen.getByRole('button', { name: '주문하기' }))

    expect(requestBody).toEqual({
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 1 },
      ],
    })
    expect(useCartStore.getState().items).toEqual({})
    expect(router.replace).toHaveBeenCalledWith('/orders')

    await waitFor(() => {
      expect(tracked('order_complete')).toHaveLength(1)
    })
    expect(tracked('order_complete')[0].properties).toMatchObject({
      orderId: 'o1',
      itemCount: 2,
      productIds: ['p1', 'p2'],
    })
  })

  it('does not emit order_complete when the order fails', async () => {
    server.use(
      http.post('http://localhost:3000/api/orders', () =>
        HttpResponse.json({ message: '주문에 실패했습니다.' }, { status: 500 }),
      ),
    )
    useCartStore.setState({ items: { p1: true } })
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(tracked('order_start')).toHaveLength(1)
    })
    await user.click(screen.getByRole('button', { name: '주문하기' }))

    expect(await screen.findByRole('alert')).toBeVisible()
    expect(tracked('order_complete')).toHaveLength(0)
  })

  it('does not call the order API for an empty cart', () => {
    let requestCount = 0
    server.use(
      http.post('http://localhost:3000/api/orders', () => {
        requestCount += 1
        return HttpResponse.json({}, { status: 500 })
      }),
    )
    renderCheckout()

    expect(
      screen.queryByRole('button', { name: '주문하기' }),
    ).not.toBeInTheDocument()
    expect(requestCount).toBe(0)
  })
})
