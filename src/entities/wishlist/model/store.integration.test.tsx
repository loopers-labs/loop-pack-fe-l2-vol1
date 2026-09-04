import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JSX } from 'react'
import { describe, expect, it } from 'vitest'
import {
  useClearWishlist,
  useToggleWish,
  useWishCount,
} from '@/entities/wishlist'

const WISH_ID = 'wishlist-product'

function WishlistStoreConsumer(): JSX.Element {
  const clearWishlist = useClearWishlist()
  const toggleWish = useToggleWish()
  const wishCount = useWishCount()

  return (
    <>
      <output data-testid="wishlist-count">{wishCount}</output>
      <button type="button" onClick={() => toggleWish(WISH_ID)}>
        Add wishlist item
      </button>
      <button type="button" onClick={clearWishlist}>
        Clear wishlist
      </button>
    </>
  )
}

describe('wishlist public store selectors', () => {
  it('clears a wishlist item added through the public toggle hook', async () => {
    const user = userEvent.setup()
    render(<WishlistStoreConsumer />)

    await user.click(screen.getByRole('button', { name: 'Add wishlist item' }))

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Clear wishlist' }))

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0')
  })
})
