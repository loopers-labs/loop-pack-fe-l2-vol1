'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import ProductCard from '@/components/commerce/ProductCard'
import { errorMessageOf, isRetryable } from '@/lib/commerce/api'
import { commerceQueries } from '@/lib/commerce/queries'
import {
  categoryFilterValues,
  sortValues,
  type CategoryFilter,
} from '@/lib/commerce/productListContract'
import { useProductListCondition } from '@/lib/commerce/useProductListCondition'
import type { ProductSort } from '@/types/commerce'
import SearchForm from './SearchForm'

// 허용값 목록은 URL 계약이라 상수로 고정한다. parser가 컴파일 타임 유니온을 요구해서
// 서버 응답으로 대체할 수 없다. 반면 표시 이름의 원본은 서버 응답이고,
// 아래 이름은 응답이 오기 전 첫 페인트에만 쓰는 폴백이다.
// all은 서버에 없는 UI 전용 값이라 항상 이쪽을 쓴다.
const categoryFallbackLabels: Record<CategoryFilter, string> = {
  all: '전체',
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
}

const sortLabels: Record<ProductSort, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
}

export default function ProductListView() {
  const { condition, setFilters, canResetFilters } = useProductListCondition()
  // 조립된 조건 하나가 그대로 query key와 요청이 된다. 기본 정렬도 API에 명시된다.
  const { data, isPending, isError, error, refetch } = useQuery(
    commerceQueries.products.list(condition),
  )

  // 표시 이름은 서버 응답에서 찾고, 없으면 폴백을 쓴다.
  const categoryLabel = (value: CategoryFilter) =>
    data?.categories.find((category) => category.id === value)?.name ??
    categoryFallbackLabels[value]

  // 검색, 카테고리, 정렬이 바뀌면 보던 페이지는 의미가 없다. 1페이지로 되돌린다.
  const handleSearch = (query: string) => {
    setFilters({ q: query, page: 1 })
  }

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const next = categoryFilterValues.find(
      (value) => value === event.target.value,
    )
    if (!next) return
    setFilters({ category: next, page: 1 })
  }

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = sortValues.find((value) => value === event.target.value)
    if (!next) return
    setFilters({ sort: next, page: 1 })
  }

  // 페이지 이동만은 나머지 조건을 그대로 둔 채 page 하나만 바꾼다.
  const handlePageChange = (page: number) => {
    setFilters({ page })
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / condition.pageSize))
    : 1

  let results: React.ReactNode
  if (isPending) {
    results = <p>상품 목록을 불러오는 중입니다.</p>
  } else if (isError) {
    // 실패 종류마다 열려 있는 길이 다르다. 셋 중 하나는 반드시 실제로 동작해야 한다.
    // 재시도는 서버 오류에만 의미가 있고, 조건이 거절된 실패는 조건을 되돌려야 벗어난다.
    // 조건이 이미 기본값이면 초기화해도 URL과 query key가 그대로라 화면이 변하지 않으므로,
    // 그때는 결과 영역 밖으로 나가는 길을 준다.
    let exit: React.ReactNode
    if (isRetryable(error)) {
      exit = (
        <button type="button" onClick={() => refetch()}>
          다시 시도
        </button>
      )
    } else if (canResetFilters) {
      exit = (
        <button type="button" onClick={() => setFilters(null)}>
          검색 조건 초기화
        </button>
      )
    } else {
      exit = <Link href="/">홈으로</Link>
    }

    results = (
      <>
        <p>{errorMessageOf(error, '상품 목록을 불러오지 못했습니다.')}</p>
        {exit}
      </>
    )
  } else if (data.products.length === 0 && data.totalCount > 0) {
    // 빈 응답에는 두 종류가 있다. 조건에 맞는 상품이 없는 것과
    // 범위 밖 페이지를 연 것. 후자는 막다른 화면이 되지 않게 출구를 준다
    results = (
      <>
        <p>없는 페이지입니다. 조건에 맞는 상품은 {data.totalCount}개입니다.</p>
        <button type="button" onClick={() => handlePageChange(1)}>
          1페이지로 이동
        </button>
      </>
    )
  } else if (data.products.length === 0) {
    results = <p>조건에 맞는 상품이 없습니다.</p>
  } else {
    results = (
      <>
        <p>총 {data.totalCount}개</p>
        <div className="week05-grid">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <nav className="week05-pagination" aria-label="페이지 이동">
          <button
            type="button"
            disabled={condition.page <= 1}
            onClick={() => handlePageChange(condition.page - 1)}
          >
            이전
          </button>
          <span>
            {condition.page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={condition.page >= totalPages}
            onClick={() => handlePageChange(condition.page + 1)}
          >
            다음
          </button>
        </nav>
      </>
    )
  }

  return (
    <main>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <div className="week05-filters">
          <SearchForm
            key={condition.q}
            initialQuery={condition.q}
            onSearch={handleSearch}
          />
          <label>
            카테고리
            <select
              name="category"
              value={condition.category}
              onChange={handleCategoryChange}
            >
              {categoryFilterValues.map((value) => (
                <option key={value} value={value}>
                  {categoryLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select
              name="sort"
              value={condition.sort}
              onChange={handleSortChange}
            >
              {sortValues.map((value) => (
                <option key={value} value={value}>
                  {sortLabels[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        {results}
      </section>
    </main>
  )
}
