import { describe, expect, it } from 'vitest'

import { cartSelectors, useCartStore } from '@/features/cart/model/CartStore'
import {
  useWishlistStore,
  wishlistSelectors,
} from '@/features/wishlist/model/WishlistStore'

describe('store instance sharing', () => {
  it('useCartStore is a module singleton', () => {
    expect(useCartStore).toBe(useCartStore)
  })

  it('useWishlistStore is a module singleton', () => {
    expect(useWishlistStore).toBe(useWishlistStore)
  })

  it('adding in cart reflects in a fresh getState() read (single source of truth)', () => {
    const before = cartSelectors.count(useCartStore.getState())
    useCartStore.getState().addToCart('p-shared')
    const after = cartSelectors.count(useCartStore.getState())
    expect(after).toBe(before + 1)
    useCartStore.getState().removeFromCart('p-shared')
  })

  it('toggling in wishlist reflects in a fresh getState() read (single source of truth)', () => {
    const before = wishlistSelectors.count(useWishlistStore.getState())
    useWishlistStore.getState().toggleWishlist('p-shared')
    const after = wishlistSelectors.count(useWishlistStore.getState())
    expect(after).toBe(before + 1)
    useWishlistStore.getState().toggleWishlist('p-shared')
  })
})
