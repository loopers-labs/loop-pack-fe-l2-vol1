import { useEffect, useState } from 'react'
import { readStoredIds, writeStoredIds } from '../utils/localStorage'

const RECENTLY_VIEWED_STORAGE_KEY = 'recentlyViewed'
const RECENTLY_VIEWED_LIMIT = 10

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() =>
    readStoredIds(RECENTLY_VIEWED_STORAGE_KEY),
  )

  useEffect(() => {
    writeStoredIds(RECENTLY_VIEWED_STORAGE_KEY, recentlyViewed)
  }, [recentlyViewed])

  const rememberProduct = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId)
      return [productId, ...without].slice(0, RECENTLY_VIEWED_LIMIT)
    })
  }

  return {
    recentlyViewed,
    rememberProduct,
  }
}
