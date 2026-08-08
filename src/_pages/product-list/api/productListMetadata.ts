import type { Metadata } from 'next'
import type { SearchParams } from 'nuqs/server'
import { isExpectedFailure } from '@/shared/api/http'
import { getQueryClient } from '@/shared/api/serverQueryClient'
import { getAppOrigin } from '@/shared/config/appOrigin'
import { sharedOpenGraph } from '@/shared/config/metadata'
import { describeEmptyResult } from '../model/emptyResult'
import { productListLabels } from '../model/labels'
import { loadProductListCondition } from '../model/serverSearchParams'
import { productListSearchParams } from '../model/searchParams'
import type { CategoryFilter, ProductListFilters } from '../model/searchParams'
import type { ProductListResponse } from './productList'
import { serverProductListQuery } from './productListServer'

// metadata와 본문이 같은 조회를 읽는다. 각자 조립하면 화면과 공유 카드가 어긋난다.
// 문구에는 사용자 조건만 쓴다. scenario는 재현용 전송 조건이라 드러나면 안 된다.

const defaults = productListSearchParams

// 카테고리 이름은 같은 응답에서 찾는다. 정적 이름을 쓰면 서버가 표시명을 바꿔도
// 본문과 공유 카드가 어긋난다.
// all은 서버에 없는 UI 전용 값이라 storefront 이름을 쓴다.
// 응답에 선택 category가 없으면 계약이 어긋난 것이다. 문장을 비우거나 id를 노출하는 대신
// storefront 이름으로 축퇴해 문장을 완성한다.
const createCategoryLabel =
  (list: ProductListResponse) => (value: CategoryFilter) => {
    if (value === defaults.category.defaultValue) {
      return productListLabels.category(value)
    }
    const found = list.categories.find((category) => category.id === value)
    return found?.name ?? productListLabels.category(value)
  }

const buildTitle = (filters: ProductListFilters) => {
  const base = filters.q ? `Search “${filters.q}”` : 'Products'
  return filters.page === defaults.page.defaultValue
    ? base
    : `${base} (page ${filters.page})`
}

const buildDescription = (
  filters: ProductListFilters,
  list: ProductListResponse,
) => {
  const category = createCategoryLabel(list)

  // 0건도 성공 응답이다. 화면이 쓰는 문장 구조를 그대로 써서 형태가 갈리지 않게 한다.
  if (list.totalCount === 0) {
    return describeEmptyResult(filters, { ...productListLabels, category })
  }

  const clauses = [
    filters.category === defaults.category.defaultValue
      ? null
      : `in ${category(filters.category)}`,
    filters.sort === defaults.sort.defaultValue
      ? null
      : `sorted by ${productListLabels.sort(filters.sort)}`,
  ].filter((clause) => clause !== null)

  const head = `${list.totalCount} products`
  return clauses.length === 0 ? `${head}.` : `${head} ${clauses.join(', ')}.`
}

export const createProductListMetadata = (
  filters: ProductListFilters,
  list: ProductListResponse,
): Metadata => {
  const title = buildTitle(filters)
  const description = buildDescription(filters, list)
  const firstImage = list.products[0]?.image

  return {
    title,
    description,
    // 페이지 openGraph는 루트를 통째로 덮는다. 공통 정체성을 펼친 뒤 이 화면 것만 얹는다.
    // 이미지가 없으면 얹지 않아 공통 fallback이 그대로 남는다.
    openGraph: {
      ...sharedOpenGraph,
      title,
      description,
      ...(firstImage ? { images: [firstImage] } : {}),
    },
  }
}

export const generateProductListMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> => {
  // 설정 누락은 조회 실패가 아니다. try 밖에서 불러 즉시 드러나게 한다.
  const origin = getAppOrigin()
  const { filters, condition } = await loadProductListCondition(searchParams)

  try {
    const list = await getQueryClient().fetchQuery(
      serverProductListQuery(condition, origin),
    )
    return createProductListMetadata(filters, list)
  } catch (error) {
    // 응답 계약이 깨진 것 같은 예상 밖 오류까지 삼키면 원인이 조용히 숨는다.
    if (!isExpectedFailure(error)) throw error

    // 빈 문자열로 덮지 않는다. 아무 필드도 정하지 않아야 root metadata가 그대로 합성된다.
    return {}
  }
}
