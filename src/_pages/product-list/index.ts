// 상품 목록 슬라이스가 외부에 공개하는 전부다. 나머지 세그먼트는 내부 구현이다.
//
// ProductListPage는 라우팅이 마운트하는 서버 셸이다. 조회는 그 아래 Suspense 안에서 기다린다.
// ProductListView는 URL 상태와 조회 결과를 소유하는 클라이언트 경계다.
// 서버 요청 컨텍스트와 분리해 상태 계약을 독립적으로 검증한다.
// generateProductListMetadata는 이 화면의 metadata 계약이다. 본문과 같은 조회를 쓴다.
export { default as ProductListPage } from './ui/ProductListPage'
export { default as ProductListView } from './ui/ProductListView'
export { generateProductListMetadata } from './api/productListMetadata'
