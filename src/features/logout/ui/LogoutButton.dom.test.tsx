import { QueryClientProvider } from '@tanstack/react-query'
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

import { AuthProvider, useAuth } from '@/entities/auth/model/AuthProvider'
import { useCartStore } from '@/entities/cart/model/CartStore'
import { useWishlistStore } from '@/entities/wishlist/model/WishlistStore'
import { getQueryClient } from '@/shared/lib/getQueryClient'

import { server } from '../../../../tests/setup/mswServer'
import { LogoutButton } from './LogoutButton'

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

function AuthStatus() {
  const { session } = useAuth()
  return <p>{session.status}</p>
}

function renderLogoutButton() {
  const queryClient = getQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        initialSession={{
          status: 'authenticated',
          user: {
            id: 'u1',
            name: '루퍼1',
            email: 'looper1@loopers.dev',
          },
        }}
      >
        <LogoutButton />
        <AuthStatus />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  router.replace.mockReset()
  router.refresh.mockReset()
  useCartStore.getState().clearCart()
  useWishlistStore.getState().clearWishlist()
})

describe('LogoutButton', () => {
  it('clears auth while retaining cart and wishlist after a successful logout', async () => {
    server.use(
      http.post(
        'http://localhost:3000/api/auth/logout',
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    useCartStore.getState().addToCart('p1')
    useWishlistStore.getState().toggleWishlist('p2')
    const user = userEvent.setup()
    renderLogoutButton()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByText('anonymous')).toBeVisible()
    expect(useCartStore.getState().items).toEqual({ p1: true })
    expect(useWishlistStore.getState().items).toEqual({ p2: true })
    expect(router.replace).toHaveBeenCalledWith('/')
    expect(router.refresh).toHaveBeenCalledOnce()
  })

  it('retains the authenticated state when logout fails', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/logout', () =>
        HttpResponse.json(
          { message: '로그아웃에 실패했습니다.' },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderLogoutButton()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getByText('authenticated')).toBeVisible()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
