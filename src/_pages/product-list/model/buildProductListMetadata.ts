import type { Metadata } from 'next'
import type {
  ProductListQuery,
  ProductListResponse,
  ProductSort,
} from '@/entities/product'
import { buildPageMetadata } from '@/shared/config/siteMetadata'

const SORT_LABELS: Record<ProductSort, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
}

export function buildProductListMetadata(
  query: Required<ProductListQuery>,
  data: ProductListResponse,
): Metadata {
  const categoryName =
    query.category === 'all'
      ? '전체'
      : (data.categories.find((category) => category.id === query.category)
          ?.name ?? '상품')
  const subject = query.q ? `“${query.q}” 검색 결과` : `${categoryName} 상품`
  const title = query.page > 1 ? `${subject} ${query.page}페이지` : subject
  const description = `카테고리 ${categoryName} · 정렬 ${SORT_LABELS[query.sort]} · 상품 ${data.totalCount}개`

  return buildPageMetadata({
    title,
    description,
    image: data.products[0]?.image,
  })
}
