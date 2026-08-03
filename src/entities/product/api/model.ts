import type { Category, CategoryId } from '@/entities/product/model/category'
import type { Product, ProductSort } from '@/entities/product/model/product'

export const PRODUCT_PAGE_SIZE = 12

// 상품 목록 API에 실제로 직렬화되는 전체 쿼리 계약.
export type ProductListQuery = {
  q?: string
  category?: CategoryId | 'all'
  sort?: ProductSort
  page?: number
  pageSize: number
}

// pageSize는 API 계층이 고정값으로 추가하므로 호출자가 선택할 수 없다.
export type GetProductListParams = Omit<ProductListQuery, 'pageSize'>

// 페이지네이션 메타는 목록 엔드포인트 자체의 계약이라 상품 도메인이 소유한다.
// (홈처럼 여러 섹션을 조립한 화면 전용 응답은 그 화면이 소유한다 — _pages/home/api/model.ts)
export type GetProductListResponse = {
  products: Product[]
  categories: Category[]
  totalCount: number
  page: number
  pageSize: number
}
