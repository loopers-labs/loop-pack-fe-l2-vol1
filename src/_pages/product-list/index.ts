// 상품 목록 슬라이스의 Public API. 라우팅 파일이 붙이는 페이지 진입점과 metadata 생성기만 연다.
// 내부 UI(ProductListContent 등)와 URL 상태 훅은 외부에서 조립할 대상이 아니라 공개하지 않는다.
export { ProductListPage } from '@/_pages/product-list/ui/ProductListPage'
// 라우팅 파일이 generateMetadata라는 이름으로 다시 내보낸다.
export { generateProductListMetadata } from '@/_pages/product-list/model/generate-metadata'
