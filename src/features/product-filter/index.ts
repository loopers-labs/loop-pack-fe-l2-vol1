/**
 * product-filter 슬라이스 Public API.
 *
 * 폼 외에 useProductFilterState 도 공개한다. 결과 영역이 조건을 알아야 하기 때문인데,
 * 이 훅이 감싸는 것은 슬라이스 내부 상태가 아니라 URL 이다.
 * URL 은 원래 화면 전체가 공유하는 진실이므로 store 원본을 노출하는 것과는 성격이 다르다.
 *
 * 조회 조건 타입(ProductListQuery)은 여기서 공개하지 않는다.
 * 그 타입의 소유자는 조회하는 쪽인 _pages/product-list 다.
 *
 * 감추는 것: nuqs 파서 정의, 필터 선택지의 원본 배열.
 */
export { ProductFilterForm } from './ui/ProductFilterForm';
export { useProductFilterState } from './model/useProductFilterState';
export { DEFAULT_PAGE_SIZE } from './config/filters';
