// cart 슬라이스의 Public API.
// 소유자 분할(ownerId·byOwner)은 store 내부 사정이라, 밖에서는 selector로만 읽는다.
export { useCartStore } from '@/entities/cart/model/cart-store'
export {
  selectCartItems,
  selectCartCount,
  selectCartTotalPrice,
  selectHasCartOwner,
  selectIsInCart,
} from '@/entities/cart/model/cart-store'
export type { CartItem } from '@/entities/cart/model/cart'
