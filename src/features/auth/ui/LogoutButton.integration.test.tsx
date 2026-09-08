import '@/test/setup/msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { act, render, screen, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { JSX } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUser } from '@/analytics/events'
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

vi.mock('@/analytics/events', () => ({
  resetUser: vi.fn(),
}))

const mockedResetUser = vi.mocked(resetUser)

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

interface RenderLogoutButtonResult extends RenderResult {
  user: UserEvent
}

function renderLogoutButton(): RenderLogoutButtonResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <LocalStateControls />
        <LogoutButton />
      </QueryClientProvider>,
    ),
  }
}

describe('LogoutButton', () => {
  beforeEach(() => {
    router.refresh.mockReset()
    mockedResetUser.mockReset()
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
    expect(mockedResetUser).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()

    if (resolveLogout === undefined) {
      throw new Error('Logout response resolver was not initialized.')
    }
    resolveLogout(new HttpResponse(null, { status: 204 }))

    await vi.waitFor(() => {
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0')
      expect(mockedResetUser).toHaveBeenCalledOnce()
      expect(router.refresh).toHaveBeenCalledOnce()
    })
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: '로그아웃 중' })).toBeDisabled()
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
    expect(mockedResetUser).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('preserves local state, skips refresh, and shows the fallback error for malformed logout failures', async () => {
    server.use(
      http.post(
        LOGOUT_ENDPOINT,
        () =>
          new HttpResponse('{not json', {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )
    const { user } = renderLogoutButton()

    await user.click(screen.getByRole('button', { name: '장바구니 담기' }))
    await user.click(screen.getByRole('button', { name: '위시리스트 담기' }))
    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(
      await screen.findByText('로그아웃에 실패했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1')
    expect(mockedResetUser).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('keeps local state and does not reset analytics for a 400 logout failure', async () => {
    server.use(
      http.post(LOGOUT_ENDPOINT, () =>
        HttpResponse.json(
          { message: 'Invalid logout request' },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderLogoutButton()
    const buttons = screen.getAllByRole('button')
    const cartButton = buttons[0]
    const wishlistButton = buttons[1]
    const logoutButton = buttons[2]
    if (
      cartButton === undefined ||
      wishlistButton === undefined ||
      logoutButton === undefined
    ) {
      throw new Error('Logout controls were not rendered.')
    }

    await user.click(cartButton)
    await user.click(wishlistButton)
    await user.click(logoutButton)

    await screen.findByRole('alert')
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1')
    expect(mockedResetUser).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('keeps local state and does not reset analytics for a network logout failure', async () => {
    server.use(http.post(LOGOUT_ENDPOINT, () => HttpResponse.error()))
    const { user } = renderLogoutButton()
    const buttons = screen.getAllByRole('button')
    const cartButton = buttons[0]
    const wishlistButton = buttons[1]
    const logoutButton = buttons[2]
    if (
      cartButton === undefined ||
      wishlistButton === undefined ||
      logoutButton === undefined
    ) {
      throw new Error('Logout controls were not rendered.')
    }

    await user.click(cartButton)
    await user.click(wishlistButton)
    await user.click(logoutButton)

    await screen.findByRole('alert')
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1')
    expect(mockedResetUser).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('starts one logout operation for two native clicks in the same tick', async () => {
    let requestCount = 0
    let releaseLogout: ((response: Response) => void) | undefined
    server.use(
      http.post(LOGOUT_ENDPOINT, () => {
        requestCount += 1
        return new Promise<Response>((resolve) => {
          releaseLogout = resolve
        })
      }),
    )
    renderLogoutButton()
    const logoutButton = screen.getAllByRole('button')[2]
    if (logoutButton === undefined) {
      throw new Error('Logout button was not rendered.')
    }

    act(() => {
      logoutButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      logoutButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })
    expect(mockedResetUser).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()

    if (releaseLogout === undefined) {
      throw new Error('Logout response resolver was not initialized.')
    }
    releaseLogout(new HttpResponse(null, { status: 204 }))

    await vi.waitFor(() => {
      expect(mockedResetUser).toHaveBeenCalledOnce()
      expect(router.refresh).toHaveBeenCalledOnce()
    })
  })
})
