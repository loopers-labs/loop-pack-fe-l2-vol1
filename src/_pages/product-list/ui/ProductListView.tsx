'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ProductGrid from '@/widgets/product-grid/ui/ProductGrid'
import { errorMessageOf, isRetryable } from '@/shared/api/http'
import { productListQueries } from '@/_pages/product-list/api/productList'
import { sortValues } from '@/entities/product/model/productListContract'
import { categoryFilterValues } from '../model/searchParams'
import { productListLabels } from '../model/labels'
import { describeEmptyResult } from '../model/emptyResult'
import { useProductListCondition } from '../model/useProductListCondition'
import ProductFilterSelect from './ProductFilterSelect'
import ProductResultsPending from './ProductResultsPending'
import SearchForm from './SearchForm'

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

  // 갱신이 최종 실패하면 새 key에는 데이터가 없다. placeholder는 pending에만 걸리기
  // 때문이다. 그러면 화면이 통째로 비어 사용자가 보던 목록과 위치를 잃는다.
  //
  // 그래서 마지막으로 실제 표시가 확정된 조건만 기억한다. 서버 응답은 여기 담지 않는다.
  // 목록의 원본은 계속 Query Cache이고, 여기 남는 것은 어느 key를 보고 있었는지뿐이다.
  const queryClient = useQueryClient()
  const lastShownCondition = useRef(condition)
  const showsCurrentResult = Boolean(data) && !isPlaceholderData
  useEffect(() => {
    if (showsCurrentResult) lastShownCondition.current = condition
  })

  // 실패했을 때만 직전 조건의 캐시를 꺼낸다. 캐시가 이미 비워졌으면 undefined가 되어
  // 보여줄 목록이 없는 실패로 자연스럽게 떨어진다.
  const previousList =
    isError && !data
      ? queryClient.getQueryData(
          productListQueries.list(lastShownCondition.current).queryKey,
        )
      : undefined

  // 화면이 실제로 그릴 목록이다. 현재 조건의 결과가 없으면 직전 결과를 쓴다.
  const shownList = data ?? previousList
  // 지금 보이는 것이 현재 URL 조건의 결과가 아니라는 뜻이다. 응답을 기다리는 중이거나
  // 갱신이 실패한 경우다. 숨기지 않고 문장으로 밝힌다.
  const showsPreviousSelection = isPlaceholderData || Boolean(previousList)
  // 그 목록을 만든 조건이다. 이전 결과를 보여주는 동안 현재 URL 조건으로 설명하면,
  // 아직 확인되지도 않은 0건을 사실처럼 말하게 된다.
  const shownCondition = showsPreviousSelection
    ? lastShownCondition.current
    : condition

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
  // 세 상황을 가르는 핵심이라 문구를 나눈다.
  let statusMessage = ''
  if (isPending) {
    statusMessage = 'Loading products.'
  } else if (previousList) {
    statusMessage =
      'Could not update results. The current list shows the previous selection.'
  } else if (isPlaceholderData) {
    statusMessage =
      'Updating results. The current list shows the previous selection.'
  } else if (isUpdating) {
    statusMessage = 'Updating results.'
  }

  // 페이지 표기의 근거는 URL이 아니라 지금 화면에 있는 응답이다. 전환 중에는 URL이
  // 먼저 새 조건으로 바뀌므로, URL을 따르면 1페이지 상품 위에 2가 적힌다.
  const shownPage = shownList?.page ?? 1
  const totalPages = shownList
    ? Math.max(1, Math.ceil(shownList.totalCount / shownList.pageSize))
    : 1

  // 개수 행과 안내 행은 결과가 있든 0건이든 같은 자리에 같은 높이로 있어야 한다.
  // 분기마다 다시 적으면 둘이 갈라져 전환할 때 화면이 밀린다.
  const countRow = shownList ? (
    <p className="product-result-count">
      {shownList.totalCount} products
      {isUpdating ? (
        <span className="product-result-updating"> · Updating…</span>
      ) : null}
    </p>
  ) : null

  // 갱신이 실패해도 목록은 남긴다. 대신 실패했다는 사실과 다시 시도할 길을
  // 목록 위에 붙여, 지금 보이는 것이 최신이 아님을 숨기지 않는다.
  // 이 행은 성공 상태와 0건에서도 비어 있는 채로 남아 자리를 지킨다.
  const noticeRow = (
    <div className="product-result-notice">
      {previousList ? (
        <>
          <span>{errorMessageOf(error, 'Could not update products.')}</span>
          <button type="button" onClick={() => refetch()}>
            Try again
          </button>
        </>
      ) : null}
    </div>
  )

  let results: React.ReactNode
  if (isPending) {
    // 서버 Suspense fallback과 같은 것을 그린다. 둘이 갈라지면 hard navigation과
    // client 전환에서 다른 화면을 보게 된다.
    results = <ProductResultsPending count={condition.pageSize} />
  } else if (!shownList) {
    // 보여줄 목록이 하나도 없는 실패다. 화면 전체가 오류와 출구를 맡는다.
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
  } else if (shownList.products.length === 0 && shownList.totalCount > 0) {
    // 빈 응답에는 두 종류가 있다. 조건에 맞는 상품이 없는 것과
    // 범위 밖 페이지를 연 것. 후자는 막다른 화면이 되지 않게 출구를 준다
    results = (
      <>
        <p>This page does not exist. {shownList.totalCount} products match.</p>
        <button type="button" onClick={() => handlePageChange(1)}>
          Go to page 1
        </button>
      </>
    )
  } else if (shownList.products.length === 0) {
    // 0건도 성공 응답이다. 개수와 조건을 성공 경로와 같은 자리에서 보여줘야
    // 사용자가 무엇을 걸어서 0건인지 알고 되돌릴 수 있다.
    results = (
      <>
        {countRow}
        {noticeRow}
        <p>
          {describeEmptyResult(shownCondition, {
            ...productListLabels,
          })}
        </p>
        {canResetFilters ? (
          <button type="button" onClick={() => setFilters(null)}>
            Reset filters
          </button>
        ) : null}
      </>
    )
  } else {
    results = (
      <>
        {countRow}
        {noticeRow}
        <ProductGrid products={shownList.products} />
        <nav className="week05-pagination" aria-label="Pagination">
          {/* 이전 조건의 결과를 보는 동안에는 이동을 막는다. 보이는 페이지를 기준으로
              또 요청을 만들면 사용자가 의도한 곳과 다른 페이지로 간다. */}
          <button
            type="button"
            disabled={showsPreviousSelection || shownPage <= 1}
            onClick={() => handlePageChange(shownPage - 1)}
          >
            Previous
          </button>
          <span>
            {shownPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={showsPreviousSelection || shownPage >= totalPages}
            onClick={() => handlePageChange(shownPage + 1)}
          >
            Next
          </button>
        </nav>
      </>
    )
  }

  // main과 제목과 설명은 서버 셸이 소유한다. 여기는 URL 상태와 조회 결과만 다룬다.
  return (
    <>
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
            label: productListLabels.category(value),
          }))}
          onChange={handleCategoryChange}
        />
        <ProductFilterSelect
          label="Sort"
          value={condition.sort}
          options={sortValues.map((value) => ({
            value,
            label: productListLabels.sort(value),
          }))}
          onChange={handleSortChange}
        />
      </div>
      {/* 이 알림은 결과 영역 밖에 둔다. aria-busy 영역 안의 변경은 보조 기술이 완료까지
          미룰 수 있는데, 완료 시점에는 이 문구가 이미 사라져 끝내 읽히지 않는다. */}
      <p className="visually-hidden" role="status">
        {statusMessage}
      </p>
      <section
        className="week05-section"
        aria-label="Product results"
        aria-busy={isFetching}
      >
        {results}
      </section>
    </>
  )
}
