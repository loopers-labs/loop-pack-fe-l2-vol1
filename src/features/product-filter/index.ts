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

/**
 * 서버가 URL 을 클라이언트와 같은 규칙으로 읽기 위한 순수 함수.
 * nuqs 는 클라이언트 전용이라 서버에는 없다. metadata 와 본문이 같은 조회 조건을
 * 만들려면 정규화 규칙이 한 벌이어야 하므로 함수만 공개하고 파서·선택지는 계속 감춘다.
 */
export { parseFilterParams, DEFAULT_FILTER_STATE } from './model/parseFilterParams';
export type { ProductFilterState, RawSearchParams } from './model/parseFilterParams';
