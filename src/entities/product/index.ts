// product 슬라이스의 Public API. 상품 도메인 타입과 목록 조회 계약을 공개한다.
// 상품 표현 UI는 찜·담기 feature를 조합하는 widgets/product-card가 소유한다.
export type { Category, CategoryId } from '@/entities/product/model/category'
export type { Product, ProductSort } from '@/entities/product/model/product'

// 목록 조회는 조회 훅과 응답 계약만 공개한다.
// queryOptions·queryKey(queries.ts), fetch 구현(api.ts), 요청 직렬화(query-schema.ts의 serializer)는
// 아직 슬라이스 외부 소비처가 없으므로 숨긴다.
export { useProductListQuery } from '@/entities/product/api/service'
export { PRODUCT_PAGE_SIZE, type GetProductListResponse } from '@/entities/product/api/model'

// 조회 파라미터 스키마. 화면은 이 parser 위에 자기 URL 동작(히스토리 등)만 얹는다.
// 정렬 UI가 실제로 참조하는 허용값 목록만 외부 계약으로 공개한다.
export { PRODUCT_SORT_VALUES, productListQueryParsers } from '@/entities/product/api/query-schema'
