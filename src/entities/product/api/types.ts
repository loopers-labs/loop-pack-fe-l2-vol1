import type { Category, CategoryId, Product, ProductSort } from '../model/types'
import type { MockApiScenario } from '@/shared/api/types'

// 상품 목록 조회 요청 조건. 전 필드 optional(요청 조립용) — URL 상태의
// ProductListParams(전 필드 필수)와는 별개 타입이다.
export type ProductListQuery = {
  q?: string
  category?: CategoryId | 'all'
  sort?: ProductSort
  page?: number
  pageSize?: number
  scenario?: MockApiScenario | null
}

// 홈 응답은 배너+카테고리+상품을 묶은 합성 계약. banner는 상품 무관 필드지만
// 백엔드(route.ts)가 _pages를 역참조하지 않도록 이 계약을 entities에 둔다(RFC 참고).
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
