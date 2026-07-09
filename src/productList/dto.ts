/**
 * 상품 목록 조회 API의 요청/응답 DTO
 * - 분리 기준: 처음에는 DTO를 fetcher 파일 안에 같이 두었습니다. 하지만 util함수가 service를 역방향 import하는
 *   순환 참조가 생겼습니다. 따라서 dto 타입 파일을 따로 만들어 분리하게되었습니다.
 */
import type { Product, ProductCategory } from './types';

export type SortBy = 'latest' | 'popular' | 'price-asc' | 'price-desc';

export interface ProductListGetFetchParams {
  category?: 'all' | ProductCategory;
  sort?: SortBy;
  q?: string;
  page?: number;
  size?: number;
  minPrice: number | '';
  maxPrice: number | '';
  inStock?: boolean;
}

export type ProductListResponse = {
  products: Product[];
  totalCount: number;
};
