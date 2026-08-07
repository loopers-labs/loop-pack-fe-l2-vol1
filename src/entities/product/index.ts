// Public API — 외부가 알아도 되는 것만 공개한다.
// productListQueryOptions는 목록 조회의 공개 계약이다. 유일 소비자(_pages/product-list)가
// 이 배럴로만 접근하게 해, queries.ts 내부 변경(파일명·시그니처)으로부터 소비자를 보호한다.
// 숨김: fetchProducts(queryOptions의 내부 구현), Badge(현재 미사용·잠정 배치).
export { ProductCard } from './ui/ProductCard'
// 카드의 로딩 자리 예약. 카드 마크업을 아는 주체가 entity라 여기서 함께 공개한다.
export { ProductGridFallback } from './ui/ProductGridFallback'
export { productListQueryOptions } from './api/queries'
export type { Product, Category, CategoryId, ProductSort } from './model/types'
export type {
  ProductListQuery,
  ProductListResponse,
  HomeResponse,
} from './api/types'
