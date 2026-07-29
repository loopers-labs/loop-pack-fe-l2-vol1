// 상품 목록 슬라이스가 외부에 공개하는 전부다.
// URL parser, 조건 조립 훅, 전송, queryOptions는 내부 구현이다.
// ProductListResponse는 프론트엔드 소비자가 아니라 mock 백엔드가 응답 형태로 참조한다.
export { default as ProductListView } from './ui/ProductListView'
export type { ProductListResponse } from './api/productList'
