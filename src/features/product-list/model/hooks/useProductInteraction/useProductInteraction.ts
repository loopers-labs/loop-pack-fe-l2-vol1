import { useLocalStorage } from '@/shared/lib'

import {
  EMPTY_PRODUCT_ID_LIST,
  PRODUCT_INTERACTION_STORAGE_KEYS,
} from './constants'
import { ProductInteractionUtils } from './productInteraction'
import type { ProductId, UseProductInteractionReturn } from './types'

export function useProductInteraction(): UseProductInteractionReturn {
  const [wishlist, setWishlist] = useLocalStorage({
    key: PRODUCT_INTERACTION_STORAGE_KEYS.wishlist,
    initialState: EMPTY_PRODUCT_ID_LIST,
  })

  const [recentlyViewed, setRecentlyViewed] = useLocalStorage({
    key: PRODUCT_INTERACTION_STORAGE_KEYS.recentlyViewed,
    initialState: EMPTY_PRODUCT_ID_LIST,
  })

  const handleWishlistToggle = (productId: ProductId) => {
    setWishlist((prev) =>
      ProductInteractionUtils.toggleWishlistProduct(prev, productId),
    )
  }

  const handleProductClick = (productId: ProductId) => {
    setRecentlyViewed((prev) =>
      ProductInteractionUtils.addRecentlyViewedProduct(prev, productId),
    )
  }

  return {
    wishlist,
    recentlyViewed,
    handleWishlistToggle,
    handleProductClick,
  }
}
