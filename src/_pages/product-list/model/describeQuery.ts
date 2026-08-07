import type { ProductListParams } from './useProductListQuery'

const CATEGORY_LABELS: Record<ProductListParams['category'], string> = {
  all: '전체',
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
}

const SORT_LABELS: Record<ProductListParams['sort'], string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
}

// 결과가 0건일 때 "무엇으로 찾았는지"를 화면에 그대로 보여주기 위한 요약.
// 빈 결과와 오류는 다른 화면이며, 빈 결과는 현재 URL 조건을 확인시켜야 한다.
export function describeQuery(query: ProductListParams): string {
  const parts = [CATEGORY_LABELS[query.category], SORT_LABELS[query.sort]]
  if (query.q !== '') {
    parts.unshift(`'${query.q}' 검색`)
  }
  return parts.join(' · ')
}
