import type { Category, CategoryId, Product, ProductSort } from '@/entities/product';

/**
 * 목록 응답을 바꾸는 시나리오 조건.
 *
 * 사용자가 고르는 필터는 아니지만 서버 응답을 바꾸는 URL 조건이라
 * query key 와 실제 GET 요청에 함께 실어야 한다.
 * 빠뜨리면 URL 은 slow 인데 캐시는 normal 응답을 돌려주어
 * 현재 URL 의 active query 와 화면 결과가 어긋난다.
 *
 * 값 목록을 app/api 의 타입에서 가져오지 않는다.
 * _pages 가 app 을 import 하면 의존 방향이 뒤집힌다(ProductListResponse 와 같은 근거).
 */
export const PRODUCT_LIST_SCENARIOS = ['empty', 'error', 'slow'] as const;

export type ProductListScenario = (typeof PRODUCT_LIST_SCENARIOS)[number];

/**
 * 상품 목록 조회 조건.
 *
 * 필터 UI 가 아니라 "목록 조회"의 것이라 이 슬라이스가 소유한다.
 * features/product-filter 는 URL 상태를 관리할 뿐이고,
 * 그 상태를 조회 조건으로 조립하는 것은 조회하는 쪽의 일이다.
 * pageSize 처럼 사용자가 고르지 않는 값이 섞여 있다는 점도 같은 근거다.
 * scenario 도 사용자가 고르지 않지만 조회 조건이라는 점에서 같다.
 */
export type ProductListQuery = {
  q?: string;
  category?: CategoryId | 'all';
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  scenario?: ProductListScenario;
};

/**
 * 상품 목록 응답 계약.
 *
 * mock 백엔드(app/api/products/route.ts)도 이 타입을 반환 타입으로 쓴다.
 * 계약의 소유자가 프론트인 근거는 _pages/home/model/types.ts 와 같다.
 */
export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};
