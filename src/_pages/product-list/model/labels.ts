import type { ProductSort } from '@/entities/product/model/product'
import type { CategoryFilter } from './searchParams'

// 화면이 쓰는 storefront 고정 이름이다. metadata는 응답의 카테고리명을 쓰고,
// 응답에 선택 category가 없을 때만 여기로 축퇴한다.
// URL parser는 storefront가 지원하는 category만 통과시킨다.
// 서버가 새 category를 내려줘도 URL 계약에 추가되기 전에는 선택 조건이 되지 않는다.
const categoryLabels: Record<CategoryFilter, string> = {
  all: 'All',
  casual: 'Casual',
  fashion: 'Fashion',
  goods: 'Beauty & Goods',
  home: 'Home',
  digital: 'Digital',
}

const sortLabels: Record<ProductSort, string> = {
  latest: 'Newest',
  popular: 'Popular',
  'price-asc': 'Price: Low to high',
  'price-desc': 'Price: High to low',
}

export const productListLabels = {
  category: (value: CategoryFilter) => categoryLabels[value],
  sort: (value: ProductSort) => sortLabels[value],
}
