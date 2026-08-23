import type { Category, Product } from '@/entities/product/model/product'
import { categories, homeBanner, products } from './commerce'

// 홈 응답을 만드는 규칙이다. mock 백엔드에 이 구현 하나만 둔다.
// route와 테스트가 각자 만들면 화면이 실제와 다른 목록을 보고 통과한다.
// 지연과 scenario는 여기 없다. 그것은 요청을 받은 쪽의 몫이다.

const HOME_SECTION_SIZE = 6

export interface HomeSelection {
  banner: typeof homeBanner
  categories: Category[]
  popularProducts: Product[]
  newProducts: Product[]
}

export const selectHome = (): HomeSelection => ({
  banner: homeBanner,
  categories,
  // 인기는 리뷰 수가 먼저다. 같으면 평점으로 가른다.
  popularProducts: [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, HOME_SECTION_SIZE),
  newProducts: [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, HOME_SECTION_SIZE),
})
