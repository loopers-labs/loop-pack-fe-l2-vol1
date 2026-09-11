import type { ProductSummary } from '@/entities/product/@x/cart'

// 담은 시점의 표시 정보를 함께 들고 있다. 장바구니·주문서가 상품을 그리려면 이름·이미지·가격이
// 필요한데, 상품을 id로 조회하는 API가 없어 담을 때 받아 둔다.
// 주문 요청에는 productId와 quantity만 싣는다 — 나머지는 화면용이고 서버 계약이 아니다.
export type CartItem = ProductSummary & {
  quantity: number
}
