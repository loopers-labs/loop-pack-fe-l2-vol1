import type { Category, CategoryId, Product, ProductSort } from '@/entities/product';

/**
 * 상품 목록 조회 조건.
 *
 * 필터 UI 가 아니라 "목록 조회"의 것이라 이 슬라이스가 소유한다.
 * features/product-filter 는 URL 상태를 관리할 뿐이고,
 * 그 상태를 조회 조건으로 조립하는 것은 조회하는 쪽의 일이다.
 * pageSize 처럼 사용자가 고르지 않는 값이 섞여 있다는 점도 같은 근거다.
 */
export type ProductListQuery = {
  q?: string;
  category?: CategoryId | 'all';
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
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
