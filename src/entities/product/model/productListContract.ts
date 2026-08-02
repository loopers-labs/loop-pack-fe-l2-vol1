import type { CategoryId, ProductSort } from './product'

// 상품 카탈로그가 지원하는 도메인 어휘만 소유한다.
export const categoryIds = [
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly CategoryId[]

export const sortValues = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[]

export const isCategoryId = (value: string): value is CategoryId =>
  categoryIds.some((category) => category === value)

export const isProductSort = (value: string): value is ProductSort =>
  sortValues.some((sort) => sort === value)
