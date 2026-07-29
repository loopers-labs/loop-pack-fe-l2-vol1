import { resetCart } from '@/entities/cart/model/cart'
import { resetWishlist } from '@/entities/wishlist/model/wishlist'

// capability마다 store가 따로라 격리도 따로다. 호출부가 둘을 각각 기억하면
// 한쪽을 빠뜨린 테스트가 생기고 그 순간 테스트 사이로 상태가 샌다.
// capability가 늘면 이 함수에 한 줄이 붙는다. 호출부는 바뀌지 않는다.
export const resetStores = () => {
  resetCart()
  resetWishlist()
}
