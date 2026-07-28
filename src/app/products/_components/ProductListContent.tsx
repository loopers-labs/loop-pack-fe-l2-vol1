'use client'

import { useQueryStates } from 'nuqs'
import { productListParsers } from '@/service/products/searchParams'
import { useProductListQuery } from '@/service/products/service'
import { ProductFilters } from '@/app/products/_components/ProductFilters'
import { ProductListResults } from '@/app/products/_components/ProductListResults'

export const ProductListContent = () => {
  const [searchParams] = useQueryStates(productListParsers)
  // 상품 목록은 조건 전환 중 이전 데이터를 유지해야 하므로 useQuery를 사용한다.
  const query = useProductListQuery(searchParams)
  // 필터는 조회 "성공"이 아니라 "완료"를 기준으로 노출한다. 실패했을 때 필터까지 사라지면
  // 사용자가 조건을 바꿔 실패 상태를 빠져나갈 방법이 없어진다(이때 카테고리 옵션은 전체만 남는다).
  // 반대로 최초 로딩 중에는 렌더링하지 않는다. 검색 input이 hydration 전 HTML에 먼저 나타나면
  // 그 사이 입력한 값이 React 이벤트로 잡히지 않고 사라진다.
  const categories = query.data?.categories ?? []

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        {!query.isPending && <ProductFilters categories={categories} />}
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        <ProductListResults query={query} />
      </section>
    </>
  )
}
