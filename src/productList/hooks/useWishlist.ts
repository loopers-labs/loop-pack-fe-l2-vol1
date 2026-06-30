import { useEffect, useState } from 'react'

const WISHLIST_STORAGE_KEY = 'wishlist'

function readStoredIds(storageKey: string) {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? (JSON.parse(stored) as number[]) : []
  } catch {
    return []
  }
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>(() =>
    readStoredIds(WISHLIST_STORAGE_KEY),
  )

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
    } catch {
      // localStorage 사용 불가 시 무시
    }
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
