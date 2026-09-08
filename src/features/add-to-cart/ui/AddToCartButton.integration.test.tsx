import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackCartAdd } from '@/analytics/events'
import { AddToCartButton } from './AddToCartButton'

vi.mock('@/analytics/events', () => ({
  trackCartAdd: vi.fn(),
}))

const PRODUCT = {
  id: 'add-to-cart-product',
  name: 'Cart analytics product',
}
const mockedTrackCartAdd = vi.mocked(trackCartAdd)

afterEach(() => {
  vi.clearAllMocks()
})

describe('AddToCartButton analytics', () => {
  it('records cart_add only for a false-to-true cart transition', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AddToCartButton productId={PRODUCT.id} productName={PRODUCT.name} />,
    )
    const button = screen.getByRole('button', {
      name: new RegExp(`^${PRODUCT.name}`),
    })

    await user.click(button)
    expect(mockedTrackCartAdd).toHaveBeenCalledExactlyOnceWith({
      productId: PRODUCT.id,
      quantity: 1,
    })

    rerender(
      <AddToCartButton productId={PRODUCT.id} productName={PRODUCT.name} />,
    )
    expect(mockedTrackCartAdd).toHaveBeenCalledOnce()

    await user.click(button)
    expect(mockedTrackCartAdd).toHaveBeenCalledOnce()
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)
    expect(mockedTrackCartAdd).toHaveBeenCalledTimes(2)
    expect(mockedTrackCartAdd).toHaveBeenLastCalledWith({
      productId: PRODUCT.id,
      quantity: 1,
    })
  })

  it('does not inflate cart_add when duplicate clicks race before rerendering', () => {
    render(
      <AddToCartButton productId={PRODUCT.id} productName={PRODUCT.name} />,
    )
    const button = screen.getByRole('button', {
      name: new RegExp(`^${PRODUCT.name}`),
    })

    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockedTrackCartAdd).toHaveBeenCalledOnce()
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
