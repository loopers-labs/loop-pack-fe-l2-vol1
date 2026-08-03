'use client'

import { useQueryStates } from 'nuqs'
import { useProductListQuery } from '@/entities/product'
import { productListParsers } from '@/_pages/product-list/model/search-params'
import { ProductFilters } from '@/_pages/product-list/ui/ProductFilters'
import { ProductFiltersSkeleton } from '@/_pages/product-list/ui/ProductFiltersSkeleton'
import { ProductListResults } from '@/_pages/product-list/ui/ProductListResults'

export const ProductListContent = () => {
  const [searchParams] = useQueryStates(productListParsers)
  // 상품 목록은 조건 전환 중 이전 데이터를 유지해야 하므로 useQuery를 사용한다.
  // pageSize는 API 계층의 고정값이라 화면에서는 사용자 조회 조건만 넘긴다.
  const query = useProductListQuery(searchParams)
  // 필터는 조회 "성공"이 아니라 "완료"를 기준으로 노출한다. 실패했을 때 필터까지 사라지면
  // 사용자가 조건을 바꿔 실패 상태를 빠져나갈 방법이 없어진다(이때 카테고리 옵션은 전체만 남는다).
  // 최초 로딩 중에는 실제 input 대신 같은 공간을 차지하는 skeleton을 렌더링한다.
  // hydration 전 입력 유실을 막으면서 조회 완료 시 필터가 추가되어 생기던 layout shift도 줄인다.
  const categories = query.data?.categories ?? []

  return (
    <>
      <section className="layout-section">
        <h1>상품 목록</h1>
        {query.isPending ? <ProductFiltersSkeleton /> : <ProductFilters categories={categories} />}
      </section>
      <section className="layout-section" aria-label="상품 검색 결과">
        <ProductListResults query={query} />
      </section>
    </>
  )
}
