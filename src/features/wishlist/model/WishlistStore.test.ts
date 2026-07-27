import { beforeEach, describe, expect, it } from 'vitest'

import { useWishlistStore, wishlistSelectors } from './WishlistStore'

const resetWishlist = () => {
  useWishlistStore.setState({ items: {} })
}

describe('WishlistStore actions', () => {
  beforeEach(() => {
    resetWishlist()
  })

  it('toggleWishlist adds productId when absent', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({ p1: true })
  })

  it('toggleWishlist removes productId when present', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({})
  })

  it('toggleWishlist preserves other items', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    toggleWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({ p2: true })
  })

  it('removeFromWishlist removes the productId', () => {
    const { toggleWishlist, removeFromWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    removeFromWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({ p2: true })
  })

  it('removeFromWishlist is a no-op when productId is absent', () => {
    const { removeFromWishlist } = useWishlistStore.getState()
    removeFromWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({})
  })

  it('clearWishlist empties items', () => {
    const { toggleWishlist, clearWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    clearWishlist()
    expect(useWishlistStore.getState().items).toEqual({})
  })
})

describe('wishlistSelectors', () => {
  beforeEach(() => {
    resetWishlist()
  })

  it('count returns 0 when empty', () => {
    expect(wishlistSelectors.count(useWishlistStore.getState())).toBe(0)
  })

  it('count derives from items length', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    toggleWishlist('p3')
    expect(wishlistSelectors.count(useWishlistStore.getState())).toBe(3)
  })

  it('count decreases when an item is removed', () => {
    const { toggleWishlist, removeFromWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    removeFromWishlist('p1')
    expect(wishlistSelectors.count(useWishlistStore.getState())).toBe(1)
  })

  it('count stays accurate after toggle off', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p1')
    expect(wishlistSelectors.count(useWishlistStore.getState())).toBe(0)
  })

  it('isInWishlist returns true for added productId', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    expect(
      wishlistSelectors.isInWishlist('p1')(useWishlistStore.getState()),
    ).toBe(true)
  })

  it('isInWishlist returns false for absent productId', () => {
    expect(
      wishlistSelectors.isInWishlist('p1')(useWishlistStore.getState()),
    ).toBe(false)
  })

  it('isInWishlist returns false after toggle off', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p1')
    expect(
      wishlistSelectors.isInWishlist('p1')(useWishlistStore.getState()),
    ).toBe(false)
  })
})
