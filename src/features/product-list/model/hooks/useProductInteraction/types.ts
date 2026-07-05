export type ProductId = number

export type ProductIdList = ReadonlyArray<ProductId>

export type UseProductInteractionReturn = {
  readonly wishlist: ProductIdList
  readonly recentlyViewed: ProductIdList
  readonly handleWishlistToggle: (productId: ProductId) => void
  readonly handleProductClick: (productId: ProductId) => void
}
