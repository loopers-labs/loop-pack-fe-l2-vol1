import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AddToCartButton } from '@/features/add-to-cart'
import { ToggleWishlistButton } from '@/features/toggle-wishlist'
import { Header } from './Header'

const PRODUCT = {
  id: 'header-count-product',
  name: '헤더 개수 상품',
}

function renderHeaderActions() {
  return {
    user: userEvent.setup(),
    ...render(
      <>
        <Header />
        <ToggleWishlistButton
          productId={PRODUCT.id}
          productName={PRODUCT.name}
        />
        <AddToCartButton productId={PRODUCT.id} productName={PRODUCT.name} />
      </>,
    ),
  }
}

describe('헤더의 장바구니·위시리스트 개수', () => {
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
