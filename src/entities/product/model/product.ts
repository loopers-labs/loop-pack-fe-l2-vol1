// 상품 도메인의 어휘다. 화면도 mock 백엔드도 이 정의를 기준으로 말한다.
// 응답 봉투(목록 응답, 홈 응답)는 화면마다 달라서 각 page 슬라이스가 소유한다.

export type CategoryId = 'casual' | 'fashion' | 'goods' | 'home' | 'digital'

export type Category = {
  id: CategoryId
  name: string
}

export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc'

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
