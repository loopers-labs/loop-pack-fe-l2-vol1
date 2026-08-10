import type { Metadata } from 'next'
import { createLoader, type SearchParams } from 'nuqs/server'
import {
  productListQueryParsers,
  productQueries,
  type GetProductListResponse,
} from '@/entities/product'
import { SORT_OPTIONS } from '@/_pages/product-list/model/search-params'
import { getServerQueryClient } from '@/shared/api/query-client'
import { OG_FALLBACK_IMAGE, sharedOpenGraph } from '@/shared/config/site'

// 화면(useQueryStates)과 같은 parser로 서버에서 URL을 정규화한다.
// nuqs/server 의존은 이 파일에만 둔다 — search-params.ts는 클라이언트 컴포넌트도 import한다.
const loadProductListQuery = createLoader(productListQueryParsers)

type ProductListQuery = Awaited<ReturnType<typeof loadProductListQuery>>

const buildTitle = (query: ProductListQuery, categoryName: string | undefined, total: number) => {
  // 검색어가 있으면 title이 검색어를 먼저 말한다. 없으면 카테고리, 그것도 없으면 목록 전체다.
  const condition = query.q
    ? `'${query.q}' 검색 결과`
    : categoryName
      ? `${categoryName} 상품`
      : '상품 목록'
  const emptyMark = total === 0 ? ' - 결과 없음' : ''
  const pageMark = query.page >= 2 ? ` (${query.page}페이지)` : ''

  return `${condition}${emptyMark}${pageMark}`
}

const buildDescription = (
  query: ProductListQuery,
  categoryName: string | undefined,
  total: number,
  isSortExplicit: boolean,
) => {
  // category·sort는 title이 아니라 description이 설명한다.
  // sort는 URL에 실제로 있을 때만 말한다. parser가 기본값(latest)을 채우므로 정규화 결과만 보면
  // 사용자가 고르지 않은 정렬까지 설명하게 된다. category는 기본값이 'all'이라 이 문제가 없다.
  const conditions = [
    categoryName ? `카테고리 ${categoryName}` : null,
    isSortExplicit ? SORT_OPTIONS.find((option) => option.value === query.sort)?.label : null,
  ].filter((condition) => condition !== null && condition !== undefined)

  const result =
    total === 0 ? '조건에 맞는 상품이 없습니다.' : `총 ${total}개의 상품을 볼 수 있습니다.`

  return conditions.length > 0 ? `${conditions.join(' · ')} · ${result}` : result
}

const findCategoryName = (
  data: GetProductListResponse,
  categoryId: ProductListQuery['category'],
) => (categoryId === 'all' ? undefined : data.categories.find(({ id }) => id === categoryId)?.name)

export const generateProductListMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> => {
  // 정규화 전 원본이 있어야 사용자가 sort를 실제로 지정했는지 알 수 있다.
  const rawSearchParams = await searchParams
  const query = loadProductListQuery(rawSearchParams)
  const isSortExplicit = rawSearchParams.sort !== undefined

  try {
    // 본문(ProductListContent)과 같은 query factory다. 정규화한 조건을 그대로 넘기므로
    // queryKey와 실제 GET URL이 화면 조회와 같아진다.
    const data = await getServerQueryClient().fetchQuery(productQueries.list(query))
    const categoryName = findCategoryName(data, query.category)
    const title = buildTitle(query, categoryName, data.totalCount)
    const description = buildDescription(query, categoryName, data.totalCount, isSortExplicit)

    return {
      title,
      description,
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        // 0건이면 첫 상품이 없다. 이때도 OG 이미지가 비지 않도록 fallback을 유지한다.
        images: [data.products[0]?.image ?? OG_FALLBACK_IMAGE],
      },
    }
  } catch {
    // 조회 실패에 페이지별 빈 값을 채우면 오히려 루트 metadata를 덮는다.
    // 빈 객체를 돌려 root 공통 title·description·openGraph를 그대로 상속시킨다.
    return {}
  }
}
