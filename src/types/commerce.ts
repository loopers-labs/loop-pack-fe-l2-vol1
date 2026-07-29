import type {
  Category,
  CategoryId,
  Product,
  ProductSort,
} from '@/entities/product/model/product'

// 화면별 응답 봉투와 mock 제어값이다. 상품 도메인 어휘는
// entities/product/model/product.ts로 옮겼다.
// 이 파일은 Phase 4에서 각 page 슬라이스와 mock 백엔드로 흩어지며 사라진다.

export type MockApiScenario = 'empty' | 'error'

export type ProductListQuery = {
  q?: string
  category?: CategoryId | 'all'
  sort?: ProductSort
  page?: number
  pageSize?: number
}

export type HomeResponse = {
  banner: { title: string; description: string; image: string }
  categories: Category[]
  popularProducts: Product[]
  newProducts: Product[]
}

export type ProductListResponse = {
  products: Product[]
  categories: Category[]
  totalCount: number
  page: number
  pageSize: number
}
