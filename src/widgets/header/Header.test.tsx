import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/entities/cart'
import { useWishlistStore } from '@/entities/wishlist'
import { AddCartButton } from '@/features/add-to-cart'
import { WishlistButton } from '@/features/add-to-wishlist'
import { Header } from '@/widgets/header/Header'
import { renderWithProviders } from '@/shared/test/render-with-providers'

vi.mock('next/navigation', () => ({
  usePathname: () => '/products',
}))

// store가 모듈 전역이라 테스트 사이에 담긴 id가 남는다. 소비처에서 setState를 쓰지 않는
// 규칙을 지키기 위해 store가 공개한 toggle로만 비운다.
const resetCollections = () => {
  for (const id of useCartStore.getState().ids) {
    useCartStore.getState().toggle(id)
  }

  for (const id of useWishlistStore.getState().ids) {
    useWishlistStore.getState().toggle(id)
  }
}

// 계획서 12번 — docs/rfc/week08-test-plan.md
describe('Header와 담기·찜 버튼', () => {
  beforeEach(resetCollections)

  it('상품을 담고 다시 빼면 버튼 상태와 헤더 개수가 함께 바뀐다', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <Header />
        <AddCartButton productId="product-1" productName="테스트 상품" />
      </>,
    )
    const cartButton = screen.getByRole('button', { name: '테스트 상품 장바구니' })

    expect(cartButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('장바구니 0')).toBeInTheDocument()

    await user.click(cartButton)

    expect(cartButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('장바구니 1')).toBeInTheDocument()

    await user.click(cartButton)

    expect(cartButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('장바구니 0')).toBeInTheDocument()
  })

  it('찜만 누르면 장바구니 개수와 담기 버튼 상태는 그대로다', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <Header />
        <WishlistButton productId="product-1" productName="테스트 상품" />
        <AddCartButton productId="product-1" productName="테스트 상품" />
      </>,
    )
    const wishlistButton = screen.getByRole('button', { name: '테스트 상품 위시리스트' })
    const cartButton = screen.getByRole('button', { name: '테스트 상품 장바구니' })

    await user.click(wishlistButton)

    expect(wishlistButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('위시리스트 1')).toBeInTheDocument()
    expect(cartButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('장바구니 0')).toBeInTheDocument()
  })

  it('서로 다른 상품을 담으면 헤더 개수가 담은 상품 수만큼 늘어난다', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <Header />
        <AddCartButton productId="product-1" productName="첫 번째 상품" />
        <AddCartButton productId="product-2" productName="두 번째 상품" />
      </>,
    )

    await user.click(screen.getByRole('button', { name: '첫 번째 상품 장바구니' }))
    await user.click(screen.getByRole('button', { name: '두 번째 상품 장바구니' }))

    expect(screen.getByText('장바구니 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '첫 번째 상품 장바구니' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '두 번째 상품 장바구니' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
