import { render, screen } from '@testing-library/react'
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

    await user.click(screen.getByRole('button', { name: '주문하기' }))

    expect(requestBody).toEqual({
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 1 },
      ],
    })
    expect(useCartStore.getState().items).toEqual({})
    expect(router.replace).toHaveBeenCalledWith('/orders')
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
