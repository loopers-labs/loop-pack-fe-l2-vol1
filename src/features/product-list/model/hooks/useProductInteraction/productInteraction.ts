import { RECENTLY_VIEWED_PRODUCT_LIMIT } from './constants'
import type { ProductId, ProductIdList } from './types'

export class ProductInteractionUtils {
  static toggleWishlistProduct(
    wishlist: ProductIdList,
    productId: ProductId,
  ): ProductIdList {
    return wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId]
  }

  static addRecentlyViewedProduct(
    recentlyViewed: ProductIdList,
    productId: ProductId,
  ): ProductIdList {
    const withoutCurrentProduct = recentlyViewed.filter(
      (id) => id !== productId,
    )

    return [productId, ...withoutCurrentProduct].slice(
      0,
      RECENTLY_VIEWED_PRODUCT_LIMIT,
    )
  }
}
