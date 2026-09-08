import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JSX } from 'react'
import { describe, expect, it } from 'vitest'
import {
  useCartCount,
  useCartIds,
  useClearCart,
  useToggleCart,
} from '@/entities/cart'

const CART_ID = 'cart-product'

function CartStoreConsumer(): JSX.Element {
  const cartIds = useCartIds()
  const cartCount = useCartCount()
  const clearCart = useClearCart()
  const toggleCart = useToggleCart()

  return (
    <>
      <output data-testid="cart-ids">{cartIds.join(',')}</output>
      <output data-testid="cart-count">{cartCount}</output>
      <button type="button" onClick={() => toggleCart(CART_ID)}>
        Add cart item
      </button>
      <button type="button" onClick={clearCart}>
        Clear cart
      </button>
    </>
  )
}

describe('cart public store selectors', () => {
  it('exposes added cart IDs and clears the cart', async () => {
    const user = userEvent.setup()
    render(<CartStoreConsumer />)

    await user.click(screen.getByRole('button', { name: 'Add cart item' }))

    expect(screen.getByTestId('cart-ids')).toHaveTextContent(CART_ID)
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Clear cart' }))

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
  })
})
