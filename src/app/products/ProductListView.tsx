'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import ProductCard from '@/components/commerce/ProductCard'
import { productListQuery } from '@/lib/commerce/queries'
import {
  categoryFilterValues,
  PRODUCT_PAGE_SIZE,
  productListSearchParams,
  productListUrlOptions,
  sortFilterValues,
  type CategoryFilter,
} from '@/lib/commerce/searchParams'
import type { ProductSort } from '@/types/commerce'
import SearchForm from './SearchForm'

const categoryLabels: Record<CategoryFilter, string> = {
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
  const [filters, setFilters] = useQueryStates(
    productListSearchParams,
    productListUrlOptions,
  )
  // URL 조건이 그대로 query key와 요청이 된다. 기본 정렬도 API에 명시된다.
  const { data, isPending, isError, refetch } = useQuery(
    productListQuery({ ...filters, pageSize: PRODUCT_PAGE_SIZE }),
  )

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
    const next = sortFilterValues.find((value) => value === event.target.value)
    if (!next) return
    setFilters({ sort: next, page: 1 })
  }

  // 페이지 이동만은 나머지 조건을 그대로 둔 채 page 하나만 바꾼다.
  const handlePageChange = (page: number) => {
    setFilters({ page })
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / PRODUCT_PAGE_SIZE))
    : 1

  let results: React.ReactNode
  if (isPending) {
    results = <p>상품 목록을 불러오는 중입니다.</p>
  } else if (isError) {
    results = (
      <>
        <p>상품 목록을 불러오지 못했습니다.</p>
        <button type="button" onClick={() => refetch()}>
          다시 시도
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
            disabled={filters.page <= 1}
            onClick={() => handlePageChange(filters.page - 1)}
          >
            이전
          </button>
          <span>
            {filters.page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => handlePageChange(filters.page + 1)}
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
            key={filters.q}
            initialQuery={filters.q}
            onSearch={handleSearch}
          />
          <label>
            카테고리
            <select
              name="category"
              value={filters.category}
              onChange={handleCategoryChange}
            >
              {categoryFilterValues.map((value) => (
                <option key={value} value={value}>
                  {categoryLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select
              name="sort"
              value={filters.sort}
              onChange={handleSortChange}
            >
              {sortFilterValues.map((value) => (
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
