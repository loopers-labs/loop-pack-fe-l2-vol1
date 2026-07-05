import { useEffect, useMemo, useRef, useState } from 'react'
import './ProductListPage.css'
import { ProductFilterPanel } from './components/ProductFilterPanel'
import { ProductGrid } from './components/ProductGrid'
import { ProductPagination } from './components/ProductPagination'
import { ProductToolbar } from './components/ProductToolbar'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useProductFilters } from './hooks/useProductFilters'
import { useProductPagination } from './hooks/useProductPagination'
import { useProducts } from './hooks/useProducts'
import { useRecentlyViewed } from './hooks/useRecentlyViewed'
import { useWishlist } from './hooks/useWishlist'
import type { ProductCategoryFilter, SortBy } from './types'
import {
  buildProductListSearchParams,
  readProductListSearchParams,
} from './utils/productListUrl'

// ─────────────────────────────────────────────────────────
// 카테고리 / 정렬 옵션 — 컴포넌트 안에 들고 다닌다
// ─────────────────────────────────────────────────────────

const CATEGORIES: { value: ProductCategoryFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'electronics', label: '전자제품' },
  { value: 'fashion', label: '패션' },
  { value: 'home', label: '홈' },
  { value: 'beauty', label: '뷰티' },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
]

const PAGE_SIZE = 12

export function ProductListPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 첫 렌더·page 보정·popstate 복원은 히스토리에 새 항목을 만들지 않는다(replace).
  // 사용자의 필터·페이지 변경만 push해서 뒤로가기가 이전 상태로 돌아가게 한다.
  const replaceNextRef = useRef(true)

  const initialState = useMemo(
    () =>
      readProductListSearchParams(new URLSearchParams(window.location.search)),
    [],
  )
  const pagination = useProductPagination({
    pageSize: PAGE_SIZE,
    initialPage: initialState.page,
  })
  const { page, changePage, resetPage } = pagination
  const filters = useProductFilters({
    initialFilters: initialState.filters,
    onFilterChange: resetPage,
  })
  const { wishlist, toggleWishlist } = useWishlist()
  const { rememberProduct } = useRecentlyViewed()
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    applyFilters,
  } = filters
  // 타이핑마다 요청하지 않도록 검색어를 디바운스한다.
  // 입력값(searchQuery)은 즉시 표시하고, 요청·URL·하이라이트는 debouncedSearchQuery를 쓴다.
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const productsQuery = useProducts({
    category,
    sortBy,
    searchQuery: debouncedSearchQuery,
    page,
    pageSize: PAGE_SIZE,
    minPrice,
    maxPrice,
    inStockOnly,
  })
  const pageInfo = pagination.getPageInfo(productsQuery.totalCount)

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    if (productsQuery.hasLoaded && page > pageInfo.totalPages) {
      replaceNextRef.current = true
      changePage(pageInfo.totalPages)
    }
  }, [changePage, page, pageInfo.totalPages, productsQuery.hasLoaded])

  // ─── 필터·검색·페이지 상태가 바뀔 때마다 URL 쿼리 동기화 ──
  useEffect(() => {
    // 디바운스 진행 중(입력값 != 요청값)에는 URL 동기화를 보류한다.
    // 이걸 안 하면 뒤로가기 직후 지연된 디바운스가 replace 플래그를 지나
    // pushState로 실행되어 히스토리에 잘못된 항목을 쌓는다.
    if (searchQuery !== debouncedSearchQuery) {
      return
    }

    const params = buildProductListSearchParams({
      filters: {
        category,
        searchQuery: debouncedSearchQuery,
        sortBy,
        minPrice,
        maxPrice,
        inStockOnly,
      },
      page,
    })

    const url = `?${params.toString()}`
    if (replaceNextRef.current) {
      window.history.replaceState(null, '', url)
      replaceNextRef.current = false
    } else {
      window.history.pushState(null, '', url)
    }
  }, [
    category,
    searchQuery,
    debouncedSearchQuery,
    page,
    sortBy,
    minPrice,
    maxPrice,
    inStockOnly,
  ])

  // 뒤로/앞으로 가기 시 URL을 읽어 필터·페이지 상태를 복원한다.
  useEffect(() => {
    const handlePopState = () => {
      const next = readProductListSearchParams(
        new URLSearchParams(window.location.search),
      )
      replaceNextRef.current = true
      applyFilters(next.filters)
      changePage(next.page)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [applyFilters, changePage])

  const handleCategoryChange = (cat: ProductCategoryFilter) => {
    filters.changeCategory(cat)
  }

  const handlePageChange = (next: number) => {
    changePage(next)
  }

  const handleResetFilters = () => {
    filters.resetFilters()
  }

  const handleProductClick = (productId: number) => {
    rememberProduct(productId)
  }

  // ─── 로딩/에러는 early return ───────────────────────────
  if (productsQuery.isLoading && productsQuery.products.length === 0) {
    return <div className="loading">로딩 중...</div>
  }

  if (productsQuery.error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {productsQuery.error.message}</p>
        <button onClick={productsQuery.refetch}>다시 시도</button>
      </div>
    )
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {productsQuery.totalCount.toLocaleString()}개의 상품
          {wishlist.length > 0 && (
            <span> · 위시리스트 {wishlist.length}개</span>
          )}
        </p>
      </header>

      <ProductFilterPanel
        categories={CATEGORIES}
        category={category}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStockOnly={inStockOnly}
        onCategoryChange={handleCategoryChange}
        onMinPriceChange={filters.changeMinPrice}
        onMaxPriceChange={filters.changeMaxPrice}
        onInStockToggle={filters.changeInStockOnly}
        onResetFilters={handleResetFilters}
      />

      <ProductToolbar
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOptions={SORT_OPTIONS}
        viewMode={viewMode}
        onSearchChange={filters.changeSearchQuery}
        onSortChange={filters.changeSortBy}
        onViewModeChange={setViewMode}
      />

      <ProductGrid
        products={productsQuery.products}
        viewMode={viewMode}
        searchQuery={debouncedSearchQuery}
        wishlist={wishlist}
        onProductClick={handleProductClick}
        onToggleWishlist={toggleWishlist}
      />

      <ProductPagination
        page={pagination.page}
        totalPages={pageInfo.totalPages}
        pageNumbers={pageInfo.pageNumbers}
        onPageChange={handlePageChange}
      />

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {productsQuery.isLoading && productsQuery.products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  )
}
