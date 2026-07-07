import { useEffect, useState } from 'react'
import { readStoredIds, writeStoredIds } from '../utils/localStorage'

const WISHLIST_STORAGE_KEY = 'wishlist'

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>(() =>
    readStoredIds(WISHLIST_STORAGE_KEY),
  )

  useEffect(() => {
    writeStoredIds(WISHLIST_STORAGE_KEY, wishlist)
  }, [wishlist])

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    )
  }

  return {
    wishlist,
    toggleWishlist,
  }
}
