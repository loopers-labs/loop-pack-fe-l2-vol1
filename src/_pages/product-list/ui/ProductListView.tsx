'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import ProductGrid from '@/widgets/product-grid/ui/ProductGrid'
import { errorMessageOf, isRetryable } from '@/shared/api/http'
import { productListQueries } from '@/_pages/product-list/api/productList'
import { sortValues } from '@/entities/product/model/productListContract'
import {
  categoryFilterValues,
  type CategoryFilter,
} from '../model/searchParams'
import { useProductListCondition } from '../model/useProductListCondition'
import type { ProductSort } from '@/entities/product/model/product'
import ProductFilterSelect from './ProductFilterSelect'
import SearchForm from './SearchForm'

// 허용값 목록은 URL 계약이라 상수로 고정한다. parser가 컴파일 타임 유니온을 요구해서
// 서버 응답으로 대체할 수 없다. 반면 표시 이름의 원본은 서버 응답이고,
// 아래 이름은 응답이 오기 전 첫 페인트에만 쓰는 폴백이다.
// all은 서버에 없는 UI 전용 값이라 항상 이쪽을 쓴다.
const categoryFallbackLabels: Record<CategoryFilter, string> = {
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

export default function ProductListView() {
  const { condition, setFilters, canResetFilters } = useProductListCondition()
  // 조립된 조건 하나가 그대로 query key와 요청이 된다. 기본 정렬도 API에 명시된다.
  // isPending은 보여줄 데이터가 아예 없는 최초 진입이다.
  // isPlaceholderData는 지금 보이는 목록이 이전 조건의 결과라는 뜻이고,
  // isFetching은 그 위에서 새 조건을 기다리는 중이라는 뜻이다. 셋을 다른 화면으로 쓴다.
  const {
    data,
    isPending,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery(productListQueries.list(condition))

  // 표시 이름은 서버 응답에서 찾고, 없으면 폴백을 쓴다.
  const categoryLabel = (value: CategoryFilter) => categoryFallbackLabels[value]

  // 검색, 카테고리, 정렬이 바뀌면 보던 페이지는 의미가 없다. 1페이지로 되돌린다.
  const handleSearch = (query: string) => {
    setFilters({ q: query, page: 1 })
  }

  const handleCategoryChange = (value: string) => {
    const next = categoryFilterValues.find(
      (categoryValue) => categoryValue === value,
    )
    if (!next) return
    setFilters({ category: next, page: 1 })
  }

  const handleSortChange = (value: string) => {
    const next = sortValues.find((sortValue) => sortValue === value)
    if (!next) return
    setFilters({ sort: next, page: 1 })
  }

  // 페이지 이동만은 나머지 조건을 그대로 둔 채 page 하나만 바꾼다.
  const handlePageChange = (page: number) => {
    setFilters({ page })
  }

  // 보여줄 목록이 이미 있는데 새 응답을 기다리는 상태다. 조건을 바꾼 경우와
  // 같은 조건을 다시 가져오는 경우 모두 사용자에게는 갱신 중이다.
  const isUpdating = isFetching && !isPending

  // 보조 기술에는 무엇이 왜 바뀌는지 문장으로 전한다. 목록이 이전 조건의 결과인지가
  // 두 상황을 가르는 핵심이라 문구를 나눈다.
  let updateMessage = ''
  if (isPlaceholderData) {
    updateMessage =
      'Updating results. The current list shows the previous selection.'
  } else if (isUpdating) {
    updateMessage = 'Updating results.'
  }

  // 페이지 표기의 근거는 URL이 아니라 지금 화면에 있는 응답이다. 전환 중에는 URL이
  // 먼저 새 조건으로 바뀌므로, URL을 따르면 1페이지 상품 위에 2가 적힌다.
  const shownPage = data?.page ?? 1
  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / data.pageSize))
    : 1

  let results: React.ReactNode
  if (isPending) {
    results = <p>Loading products…</p>
  } else if (isError) {
    // 실패 종류마다 열려 있는 길이 다르다. 셋 중 하나는 반드시 실제로 동작해야 한다.
    // 재시도는 서버 오류에만 의미가 있고, 조건이 거절된 실패는 조건을 되돌려야 벗어난다.
    // 조건이 이미 기본값이면 초기화해도 URL과 query key가 그대로라 화면이 변하지 않으므로,
    // 그때는 결과 영역 밖으로 나가는 길을 준다.
    let exit: React.ReactNode
    if (isRetryable(error)) {
      exit = (
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      )
    } else if (canResetFilters) {
      exit = (
        <button type="button" onClick={() => setFilters(null)}>
          Reset filters
        </button>
      )
    } else {
      exit = <Link href="/">Go home</Link>
    }

    results = (
      <>
        <p>{errorMessageOf(error, 'Could not load products.')}</p>
        {exit}
      </>
    )
  } else if (data.products.length === 0 && data.totalCount > 0) {
    // 빈 응답에는 두 종류가 있다. 조건에 맞는 상품이 없는 것과
    // 범위 밖 페이지를 연 것. 후자는 막다른 화면이 되지 않게 출구를 준다
    results = (
      <>
        <p>This page does not exist. {data.totalCount} products match.</p>
        <button type="button" onClick={() => handlePageChange(1)}>
          Go to page 1
        </button>
      </>
    )
  } else if (data.products.length === 0) {
    results = <p>No products match your filters.</p>
  } else {
    results = (
      <>
        {/* 갱신 표시를 개수 행 안에 넣는다. 새 줄을 끼우면 그만큼 아래가 밀린다. */}
        <p className="product-result-count">
          {data.totalCount} products
          {isUpdating ? (
            <span className="product-result-updating"> · Updating…</span>
          ) : null}
        </p>
        <ProductGrid products={data.products} />
        <nav className="week05-pagination" aria-label="Pagination">
          {/* 전환 중 이동을 막는다. 보이는 것은 이전 페이지라 여기서 한 번 더 누르면
              사용자가 의도한 곳과 다른 페이지로 간다. */}
          <button
            type="button"
            disabled={isPlaceholderData || shownPage <= 1}
            onClick={() => handlePageChange(shownPage - 1)}
          >
            Previous
          </button>
          <span>
            {shownPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={isPlaceholderData || shownPage >= totalPages}
            onClick={() => handlePageChange(shownPage + 1)}
          >
            Next
          </button>
        </nav>
      </>
    )
  }

  return (
    <main>
      <section className="product-list-hero">
        <p className="product-list-eyebrow">SHOP</p>
        <h1>Products</h1>
        <p className="product-list-description">
          Objects worth keeping, selected for everyday life.
        </p>
        <div className="week05-filters">
          <SearchForm
            key={condition.q}
            initialQuery={condition.q}
            onSearch={handleSearch}
          />
          <ProductFilterSelect
            label="Category"
            value={condition.category}
            options={categoryFilterValues.map((value) => ({
              value,
              label: categoryLabel(value),
            }))}
            onChange={handleCategoryChange}
          />
          <ProductFilterSelect
            label="Sort"
            value={condition.sort}
            options={sortValues.map((value) => ({
              value,
              label: sortLabels[value],
            }))}
            onChange={handleSortChange}
          />
        </div>
      </section>
      {/* 이 알림은 결과 영역 밖에 둔다. aria-busy 영역 안의 변경은 보조 기술이 완료까지
          미룰 수 있는데, 완료 시점에는 이 문구가 이미 사라져 끝내 읽히지 않는다. */}
      <p className="visually-hidden" role="status">
        {updateMessage}
      </p>
      <section
        className="week05-section"
        aria-label="Product results"
        aria-busy={isFetching}
      >
        {results}
      </section>
    </main>
  )
}
