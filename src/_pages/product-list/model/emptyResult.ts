import type { ProductSort } from '@/entities/product/model/product'
import {
  productListSearchParams,
  type CategoryFilter,
  type ProductListFilters,
} from './searchParams'

// 결과가 0건일 때 무엇을 걸어서 0건인지 문장으로 만든다.
// 개수만 보여주면 사용자는 무엇을 되돌려야 할지 알 수 없다.
//
// 기본값 판정의 원본은 parser다. 여기서 기본값을 다시 적으면 두 곳이 갈린다.
// 표시 이름은 화면 소유라 밖에서 받는다.
// scenario는 필터 그룹 밖이라 애초에 이 타입으로 들어오지 않는다.

interface EmptyResultLabels {
  category: (value: CategoryFilter) => string
  sort: (value: ProductSort) => string
}

export const describeEmptyResult = (
  filters: ProductListFilters,
  labels: EmptyResultLabels,
): string => {
  const defaults = productListSearchParams

  const hasQuery = filters.q !== defaults.q.defaultValue
  const categoryClause =
    filters.category === defaults.category.defaultValue
      ? null
      : `in ${labels.category(filters.category)}`
  const sortClause =
    filters.sort === defaults.sort.defaultValue
      ? null
      : `sorted by ${labels.sort(filters.sort)}`
  const pageClause =
    filters.page === defaults.page.defaultValue
      ? null
      : `on page ${filters.page}`

  // 조건이 하나도 없는데 filters라는 말을 쓰면 거짓이 된다.
  if (!hasQuery && !categoryClause && !sortClause && !pageClause) {
    return 'No products are available.'
  }

  let sentence = hasQuery
    ? `No products match “${filters.q}”`
    : 'No products found'
  if (categoryClause) sentence += ` ${categoryClause}`
  // sorted by는 삽입구라 쉼표로 끊는다. on page는 앞말에 바로 붙는 편이 자연스럽고,
  // 삽입구 뒤에 올 때만 쉼표가 필요하다.
  if (sortClause) sentence += `, ${sortClause}`
  if (pageClause) sentence += sortClause ? `, ${pageClause}` : ` ${pageClause}`

  return `${sentence}.`
}
