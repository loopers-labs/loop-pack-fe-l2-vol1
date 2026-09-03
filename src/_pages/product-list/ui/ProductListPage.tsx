'use client'

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ProductGridFallback,
  productListQueryOptions,
  type ProductListResponse,
} from '@/entities/product'
import { getPageNumbers } from '@/shared/lib/getPageNumbers'
import { trackProductListView } from '@/analytics/events'
import { ProductFilters } from './ProductFilters'
import { ProductResults } from './ProductResults'
import { describeQuery } from '../model/describeQuery'
import { useProductListQuery } from '../model/useProductListQuery'

const MIN_PAGE = 1
// 서버 기본 pageSize와 같게 둔다 — fallback이 실제 결과와 다른 개수면 교체 때 자리가 움직인다.
const PAGE_SIZE = 12

// nuqs(useSearchParams 기반)를 쓰는 부분은 Suspense 경계로 감싼다 (정적 프리렌더 요구사항).
// 바깥 셸(h1·설명·필터 자리)은 이 경계 밖이라 데이터를 기다리지 않는다.
interface ProductListPageProps {
  children?: ReactNode
}

export function ProductListPage({
  children,
}: ProductListPageProps): JSX.Element {
  return (
    <main className="week05-page">
      <header className="week05-section">
        <h1>상품 목록</h1>
        <p>카테고리와 정렬 조건으로 원하는 상품을 찾아보세요.</p>
      </header>

      <Suspense fallback={<ProductsContentFallback />}>
        {children ?? <ProductListContent />}
      </Suspense>
    </main>
  )
}

function ProductsContentFallback(): JSX.Element {
  return (
    <section className="week05-section" aria-label="상품 검색 결과">
      <ProductGridFallback count={PAGE_SIZE} />
    </section>
  )
}

export function ProductListContent(): JSX.Element {
  const queryClient = useQueryClient()
  const lastTrackedQuerySignature = useRef<string | null>(null)
  const { query, setSearch, setCategory, setSort, setPage, replacePage } =
    useProductListQuery()
  // page < 1(0·음수)은 응답을 볼 것도 없이 잘못된 값이고, 서버도 400으로 거절한다.
  // 그래서 요청에는 보정한 값을 바로 실어 헛된 400을 만들지 않는다. URL은 아래 effect가 고친다.
  const isPageBelowMin = query.page < MIN_PAGE
  const listQuery = isPageBelowMin ? { ...query, page: MIN_PAGE } : query
  const requestedPage = listQuery.page
  const [lastSuccessfulQuery, setLastSuccessfulQuery] = useState(listQuery)
  const [isRetrying, setIsRetrying] = useState(false)

  const {
    data,
    isPending,
    isError,
    error,
    isPlaceholderData,
    isFetching,
    refetch,
  } = useQuery(productListQueryOptions(listQuery))

  const rememberDisplayedQuery = (): void => {
    if (data !== undefined && !isError && !isPlaceholderData) {
      setLastSuccessfulQuery(listQuery)
    }
  }

  const previousData = isError
    ? queryClient.getQueryData<ProductListResponse>(
        productListQueryOptions(lastSuccessfulQuery).queryKey,
      )
    : undefined
  const visibleData = data ?? previousData

  // 반대쪽 끝: 서버는 범위를 벗어난 page에도 200과 빈 목록을 준다(totalCount는 그대로).
  // 그대로 두면 결과가 30개인데도 "0개"로 보이고 페이지네이션까지 사라져 화면 안에
  // 돌아갈 길이 없다. 존재하는 마지막 페이지로 URL을 고쳐 쓴다.
  const totalPages = data
    ? getPageNumbers(requestedPage, data.totalCount, data.pageSize).totalPages
    : null
  const outOfRangePage =
    totalPages !== null && requestedPage > totalPages ? totalPages : null
  const isPageOutOfRange = outOfRangePage !== null

  // range 보정 중에는 옛 page의 응답이 잠깐 그대로 보인다. 그 응답은 products가 비었지만
  // totalCount > 0 — 진짜 빈 검색 결과(둘 다 0)와 다르다.
  const isCorrectingPage = data
    ? data.products.length === 0 && data.totalCount > 0
    : false

  // 보정은 양쪽 끝 모두 필요하다 — 1보다 작으면 첫 페이지로, 마지막을 넘으면 마지막 페이지로.
  const correctedPage = isPageBelowMin ? MIN_PAGE : outOfRangePage
  const displayedQuerySignature = JSON.stringify([
    listQuery.q,
    listQuery.category,
    listQuery.sort,
    listQuery.page,
    listQuery.pageSize,
    listQuery.scenario,
  ])

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true)
    await refetch()
    setIsRetrying(false)
  }

  useEffect(() => {
    if (correctedPage !== null) {
      replacePage(correctedPage)
    }
  }, [correctedPage, replacePage])

  useEffect(() => {
    if (
      data === undefined ||
      isPlaceholderData ||
      correctedPage !== null ||
      lastTrackedQuerySignature.current === displayedQuerySignature
    ) {
      return
    }

    lastTrackedQuerySignature.current = displayedQuerySignature
    trackProductListView({
      category: listQuery.category,
      sort: listQuery.sort,
      page: listQuery.page,
    })
  }, [
    correctedPage,
    data,
    displayedQuerySignature,
    isPlaceholderData,
    listQuery.category,
    listQuery.page,
    listQuery.sort,
  ])

  // 여섯 화면을 가르는 축은 둘뿐이다 — 보여줄 목록이 있는가, 지금 실패했는가.
  //   목록 없음 + 로딩  → 실제 크기의 pending UI
  //   목록 없음 + 실패  → 목록 대신 오류와 재시도
  //   목록 있음 + 갱신  → 목록을 유지하고 갱신 중임을 표시(placeholderData·aria-busy)
  //   목록 있음 + 실패  → 목록을 유지한 채 인라인 오류와 재시도
  //   성공 + 0건        → 현재 URL 조건과 0개임을 확정해 보여줌(ProductResults)
  //   취소              → 상태가 바뀌지 않으므로 아무 오류도 나타나지 않는다
  const hasList = visibleData !== undefined
  const retryButton = (
    <button
      type="button"
      className="commerce-retry-button"
      onClick={() => void handleRetry()}
      disabled={isFetching || isRetrying}
    >
      {isFetching || isRetrying ? '재시도 중…' : '다시 시도'}
    </button>
  )

  return (
    <>
      <section className="week05-section">
        <ProductFilters
          q={query.q}
          category={query.category}
          sort={query.sort}
          onSearch={(q) => {
            rememberDisplayedQuery()
            setSearch(q)
          }}
          onCategoryChange={(category) => {
            rememberDisplayedQuery()
            setCategory(category)
          }}
          onSortChange={(sort) => {
            rememberDisplayedQuery()
            setSort(sort)
          }}
        />
      </section>

      <section className="week05-section" aria-label="상품 검색 결과">
        {(isPending && !isRetrying) ||
        (hasList && (isPageOutOfRange || isCorrectingPage)) ? (
          <ProductGridFallback count={PAGE_SIZE} />
        ) : !hasList ? (
          <p className="commerce-status">
            {error?.message ?? '상품을 불러오지 못했습니다.'}
            <br />
            {retryButton}
          </p>
        ) : (
          <>
            {isError && (
              <p className="commerce-inline-error" role="status">
                목록을 갱신하지 못했습니다. 아래는 직전 결과입니다.{' '}
                {retryButton}
              </p>
            )}
            <ProductResults
              data={visibleData}
              onPageChange={(page) => {
                rememberDisplayedQuery()
                setPage(page)
              }}
              isPlaceholderData={isPlaceholderData}
              conditionSummary={describeQuery(query)}
            />
          </>
        )}
      </section>
    </>
  )
}
