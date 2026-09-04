import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { Providers } from '@/app/providers'

import { server } from '../../../../tests/setup/mswServer'
import { OrdersView } from './OrdersView'

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

describe('OrdersView', () => {
  it('renders the authenticated user orders received from the API', async () => {
    server.use(
      http.get('http://localhost:3000/api/orders', () =>
        HttpResponse.json({
          orders: [
            {
              id: 'o7',
              createdAt: '2026-09-01T00:00:00.000Z',
              items: [{ productId: 'p3', quantity: 1 }],
            },
          ],
        }),
      ),
    )

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
        <OrdersView userId="u1" />
      </Providers>,
    )

    expect(
      await screen.findByText('o7', undefined, { timeout: 5_000 }),
    ).toBeVisible()
    expect(screen.getByText('p3 × 1')).toBeVisible()
  })
})
