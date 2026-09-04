// wishlist 슬라이스의 Public API.
// 소유자 분할(ownerId·byOwner)은 store 내부 사정이라, 밖에서는 selector로만 읽는다.
export { useWishlistStore } from '@/entities/wishlist/model/wishlist-store'
export {
  selectWishlistItems,
  selectWishlistCount,
  selectHasWishlistOwner,
  selectIsWishlisted,
} from '@/entities/wishlist/model/wishlist-store'
export type { WishlistItem } from '@/entities/wishlist/model/wishlist'
