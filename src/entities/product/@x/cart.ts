// entities/cart에만 공개하는 상품 타입. 장바구니가 담은 시점의 표시 정보를 들게 되면서
// 상품 표현을 알아야 해졌는데, 소유자는 여전히 상품 도메인이다.
// 타입만 내보낸다 — store·UI·API 같은 런타임 구현은 @x로 공개하지 않는다.
export type { ProductSummary } from '@/entities/product/model/product'
