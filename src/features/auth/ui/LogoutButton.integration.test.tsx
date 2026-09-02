import '@/test/setup/msw'
import { HttpResponse, http } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JSX } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartCount, useToggleCart } from '@/entities/cart'
import { useToggleWish, useWishCount } from '@/entities/wishlist'
import { server } from '@/test/mocks/server'
import { LogoutButton } from './LogoutButton'

const LOGOUT_ENDPOINT = 'http://localhost:3000/api/auth/logout'
const CART_ITEM_ID = 'logout-cart-item'
const WISHLIST_ITEM_ID = 'logout-wishlist-item'

const router = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

function LocalStateControls(): JSX.Element {
  const cartCount = useCartCount()
  const toggleCart = useToggleCart()
  const toggleWish = useToggleWish()
  const wishCount = useWishCount()

  return (
    <>
      <output data-testid="cart-count">{cartCount}</output>
      <output data-testid="wishlist-count">{wishCount}</output>
      <button type="button" onClick={() => toggleCart(CART_ITEM_ID)}>
        장바구니 담기
      </button>
      <button type="button" onClick={() => toggleWish(WISHLIST_ITEM_ID)}>
        위시리스트 담기
      </button>
    </>
  )
}

function renderLogoutButton() {
  return {
    user: userEvent.setup(),
    ...render(
      <>
        <LocalStateControls />
        <LogoutButton />
      </>,
    ),
  }
}

describe('LogoutButton', () => {
  beforeEach(() => {
    router.refresh.mockReset()
  })

  it('waits for a 204 before clearing wishlist state and refreshing', async () => {
    let receivedMethod = ''
    let resolveLogout: ((response: Response) => void) | undefined
    server.use(
      http.post(LOGOUT_ENDPOINT, ({ request }) => {
        receivedMethod = request.method
        return new Promise<Response>((resolve) => {
          resolveLogout = resolve
        })
      }),
    )
    const { user } = renderLogoutButton()

    await user.click(screen.getByRole('button', { name: '장바구니 담기' }))
    await user.click(screen.getByRole('button', { name: '위시리스트 담기' }))
    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    await vi.waitFor(() => {
      expect(receivedMethod).toBe('POST')
    })
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1')
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(router.refresh).not.toHaveBeenCalled()

    if (resolveLogout === undefined) {
      throw new Error('Logout response resolver was not initialized.')
    }
    resolveLogout(new HttpResponse(null, { status: 204 }))

    await vi.waitFor(() => {
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0')
      expect(router.refresh).toHaveBeenCalledOnce()
    })
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
  })

  it('preserves local state, skips refresh, and shows the server error on logout failure', async () => {
    server.use(
      http.post(LOGOUT_ENDPOINT, () =>
        HttpResponse.json(
          { message: '로그아웃을 완료할 수 없습니다.' },
          { status: 500 },
        ),
      ),
    )
    const { user } = renderLogoutButton()

    await user.click(screen.getByRole('button', { name: '장바구니 담기' }))
    await user.click(screen.getByRole('button', { name: '위시리스트 담기' }))
    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(
      await screen.findByText('로그아웃을 완료할 수 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1')
    expect(router.refresh).not.toHaveBeenCalled()
  })
})
