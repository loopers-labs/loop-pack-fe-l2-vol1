import type { ProductSummary } from '@/entities/product/@x/wishlist'

// 장바구니와 같은 이유로 표시 정보를 들고 있다(entities/cart/model/cart.ts).
// 찜은 수량이 없어 상품 표현 그대로다.
export type WishlistItem = ProductSummary
