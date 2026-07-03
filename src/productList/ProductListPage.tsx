import { useEffect, useMemo, useState } from 'react'
import './ProductListPage.css'
import { ProductFilterPanel } from './components/ProductFilterPanel'
import { ProductGrid } from './components/ProductGrid'
import { ProductPagination } from './components/ProductPagination'
import { ProductToolbar } from './components/ProductToolbar'
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

  const initialState = useMemo(
    () =>
      readProductListSearchParams(new URLSearchParams(window.location.search)),
    [],
  )
  const pagination = useProductPagination({
    pageSize: PAGE_SIZE,
    initialPage: initialState.page,
  })
  const filters = useProductFilters({
    initialFilters: initialState.filters,
    onFilterChange: pagination.resetPage,
  })
  const { wishlist, toggleWishlist } = useWishlist()
  const { rememberProduct } = useRecentlyViewed()
  const { category, minPrice, maxPrice, sortBy, searchQuery, inStockOnly } =
    filters
  const productsQuery = useProducts({
    category,
    sortBy,
    searchQuery,
    page: pagination.page,
    pageSize: PAGE_SIZE,
    minPrice,
    maxPrice,
    inStockOnly,
  })
  const pageInfo = pagination.getPageInfo(productsQuery.totalCount)

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pagination.page])

  // ─── 필터·검색·페이지 상태가 바뀔 때마다 URL 쿼리 동기화 ──
  useEffect(() => {
    const params = buildProductListSearchParams({
      filters: {
        category,
        searchQuery,
        sortBy,
        minPrice,
        maxPrice,
        inStockOnly,
      },
      page: pagination.page,
    })

    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [
    category,
    searchQuery,
    pagination.page,
    sortBy,
    minPrice,
    maxPrice,
    inStockOnly,
  ])

  const handleCategoryChange = (cat: ProductCategoryFilter) => {
    filters.changeCategory(cat)
  }

  const handlePageChange = (next: number) => {
    pagination.changePage(next)
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
        searchQuery={searchQuery}
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
