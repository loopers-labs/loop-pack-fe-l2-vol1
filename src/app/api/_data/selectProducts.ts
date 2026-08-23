import type {
  CategoryId,
  Product,
  ProductSort,
} from '@/entities/product/model/product'
import { products } from './commerce'

// 조건에서 목록을 고르는 규칙이다. mock 백엔드에 이 구현 하나만 둔다.
// route와 테스트가 각자 고르면, 통합 테스트는 실제 응답과 다른 목록을 보고 통과한다.
// 검증과 지연과 scenario는 여기 없다. 그것은 요청을 받은 쪽의 몫이다.

export interface ProductSelectionCondition {
  // 검색어가 없는 것과 빈 문자열은 같은 조건이라 하나로 받는다.
  q: string
  // null은 조건 없음이다. 'all'은 사용자가 전체를 고른 것이고 결과는 같다.
  category: CategoryId | 'all' | null
  sort: ProductSort | null
  page: number
  pageSize: number
}

export interface ProductSelection {
  products: Product[]
  totalCount: number
}

export const selectProducts = ({
  q,
  category,
  sort,
  page,
  pageSize,
}: ProductSelectionCondition): ProductSelection => {
  // 대소문자와 앞뒤 공백은 검색 조건이 아니다.
  const keyword = q.trim().toLocaleLowerCase('ko')

  const filtered = products.filter((product) => {
    const matchesCategory =
      category === null || category === 'all' || product.category === category
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase(
      'ko',
    )
    return matchesCategory && searchable.includes(keyword)
  })

  const sorted = [...filtered]

  if (sort !== null) {
    sorted.sort((a, b) => {
      switch (sort) {
        case 'popular':
          return b.reviewCount - a.reviewCount || b.rating - a.rating
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'latest':
          return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      }
    })
  }

  const start = (page - 1) * pageSize

  // totalCount는 페이지가 아니라 조건에 맞는 전체 개수다.
  // 화면은 이 값으로 마지막 페이지를 계산한다.
  return {
    products: sorted.slice(start, start + pageSize),
    totalCount: filtered.length,
  }
}
