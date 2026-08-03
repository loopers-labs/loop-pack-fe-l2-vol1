import type { Category, Product } from '@/entities/product'

// 홈은 사용자 파라미터가 없다. scenario는 mock 검증 전용이라 클라이언트에서 보내지 않는다.
// 응답 봉투(어떤 섹션이 어떤 순서로 오는가)는 상품 도메인이 아니라 이 화면의 조회 계약이라
// entities가 아니라 조회하는 쪽이 소유한다. 그래서 이 슬라이스가 홈 조회 계약 전체를 갖는다.
export type GetHomeResponse = {
  banner: { title: string; description: string; image: string }
  categories: Category[]
  popularProducts: Product[]
  newProducts: Product[]
}
