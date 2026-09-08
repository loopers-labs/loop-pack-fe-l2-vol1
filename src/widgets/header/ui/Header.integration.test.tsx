import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddToCartButton } from '@/features/add-to-cart'
import { ToggleWishlistButton } from '@/features/toggle-wishlist'
import { HeaderActions } from './HeaderActions'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const PRODUCT = {
  id: 'header-count-product',
  name: '헤더 개수 상품',
}

interface RenderHeaderActionsResult extends RenderResult {
  user: UserEvent
}

function renderHeaderActions(
  userName: string | null = null,
): RenderHeaderActionsResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <HeaderActions userName={userName} />
        <ToggleWishlistButton
          productId={PRODUCT.id}
          productName={PRODUCT.name}
        />
        <AddToCartButton productId={PRODUCT.id} productName={PRODUCT.name} />
      </QueryClientProvider>,
    ),
  }
}

describe('헤더의 장바구니·위시리스트 개수', () => {
  it('장바구니 개수에서 주문서로 이동할 수 있다', () => {
    renderHeaderActions()

    expect(screen.getByRole('link', { name: '장바구니 0' })).toHaveAttribute(
      'href',
      '/checkout',
    )
  })

  it('비로그인 사용자에게 로그인 링크를 보여준다', () => {
    renderHeaderActions()

    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('로그인 사용자에게 이름과 로그아웃 버튼을 보여준다', () => {
    renderHeaderActions('루퍼스')

    expect(screen.getByText('루퍼스')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('장바구니를 토글하면 장바구니 개수만 증가한다', async () => {
    const { user } = renderHeaderActions()

    await user.click(
      screen.getByRole('button', { name: `${PRODUCT.name} 장바구니` }),
    )

    expect(screen.getByText('장바구니 1')).toBeInTheDocument()
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument()
  })

  it('위시리스트를 토글하면 위시리스트 개수만 증가한다', async () => {
    const { user } = renderHeaderActions()

    await user.click(
      screen.getByRole('button', { name: `${PRODUCT.name} 위시리스트` }),
    )

    expect(screen.getByText('위시리스트 1')).toBeInTheDocument()
    expect(screen.getByText('장바구니 0')).toBeInTheDocument()
  })
})
