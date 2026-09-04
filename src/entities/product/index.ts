// product 슬라이스의 Public API. 상품 도메인 타입과 목록 조회 계약을 공개한다.
// 상품 표현 UI는 찜·담기 feature를 조합하는 widgets/product-card가 소유한다.
export type { Category, CategoryId } from '@/entities/product/model/category'
export type { Product, ProductSort, ProductSummary } from '@/entities/product/model/product'

// 목록 조회는 조회 훅과 응답 계약, 그리고 캐시에 남은 직전 목록을 읽는 함수만 공개한다.
// fetch 구현(api.ts)과 요청 직렬화(query-schema.ts의 serializer)는 외부 소비처가 없으므로 숨긴다.
// productQueries는 서버 metadata가 화면과 같은 queryKey·GET URL을 만들어야 해서 함께 공개한다.
export { useProductListQuery } from '@/entities/product/api/service'
export { getLatestProductList, productQueries } from '@/entities/product/api/queries'
export { PRODUCT_PAGE_SIZE, type GetProductListResponse } from '@/entities/product/api/model'

// 조회 파라미터 스키마. 화면은 이 parser 위에 자기 URL 동작(히스토리 등)만 얹는다.
// 정렬 UI가 실제로 참조하는 허용값 목록만 외부 계약으로 공개한다.
export {
  PRODUCT_CATEGORY_FILTERS,
  PRODUCT_SORT_VALUES,
  productListQueryParsers,
} from '@/entities/product/api/query-schema'
