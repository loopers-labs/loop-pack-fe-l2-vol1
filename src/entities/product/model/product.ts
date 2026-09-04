import type { CategoryId } from '@/entities/product/model/category'

export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc'

// 상품을 "보여주는" 곳이 실제로 그리는 필드만 모은 표현용 타입.
// 응답 DTO(Product)를 그대로 넘기면 화면이 쓰지 않는 sizes·rating·createdAt의 변경까지
// 영향권에 들어온다. 구조적 타이핑 덕에 Product는 그대로 이 자리에 들어온다.
//
// 카드(widgets/product-card)와 장바구니·위시리스트 store가 함께 쓰므로 상품 도메인이 소유한다.
// widgets에 두면 features와 entities가 상위 레이어를 참조하게 된다.
export type ProductSummary = {
  id: string
  brand: string
  name: string
  price: number
  image: string
}

export type Product = {
  id: string
  brand: string
  name: string
  category: CategoryId
  price: number
  originalPrice: number | null
  image: string
  freeShipping: boolean
  sizes: Array<{ value: number; stock: number }>
  rating: number
  reviewCount: number
  createdAt: string
}
