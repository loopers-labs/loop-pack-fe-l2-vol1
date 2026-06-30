import { useEffect, useMemo, useState } from 'react'
import './ProductListPage.css'
import { useProductFilters } from './hooks/useProductFilters'
import { useProductPagination } from './hooks/useProductPagination'
import { useProducts } from './hooks/useProducts'
import { useRecentlyViewed } from './hooks/useRecentlyViewed'
import { useWishlist } from './hooks/useWishlist'
import type { ProductCategoryFilter, SortBy } from './types'
import {
  formatPrice,
  getDiscountRate,
  isAlmostSoldOut,
  isBestSeller,
  isFreeShipping,
  isHotDeal,
  isNewProduct,
  isSoldOut,
} from './utils/productRules'
import {
  buildProductListSearchParams,
  readProductListSearchParams,
} from './utils/productListUrl'
import { splitHighlightedText } from './utils/textHighlight'

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

// ─────────────────────────────────────────────────────────
// 500줄+ 컴포넌트 — 아직 UI, 상태, 저장소 동기화가 한 파일에 남아 있다
// ─────────────────────────────────────────────────────────

export function ProductListPage() {
  // ─── 옵션 토글 ──────────────────────────────────────────
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

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filters.changeMinPrice(e.target.value)
  }

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filters.changeMaxPrice(e.target.value)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    filters.changeSortBy(e.target.value as SortBy)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filters.changeSearchQuery(e.target.value)
  }

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    filters.changeInStockOnly(e.target.checked)
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
        <button onClick={() => window.location.reload()}>다시 시도</button>
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

      {/* ─── 필터 패널 ──────────────────────────────────── */}
      <section className="filter-panel">
        <div className="filter-group">
          <label>카테고리</label>
          <div className="category-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={category === cat.value ? 'active' : ''}
                onClick={() => handleCategoryChange(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>가격 범위</label>
          <div className="price-range">
            <input
              type="number"
              placeholder="최소"
              value={minPrice}
              onChange={handleMinPriceChange}
              min={0}
            />
            <span>~</span>
            <input
              type="number"
              placeholder="최대"
              value={maxPrice}
              onChange={handleMaxPriceChange}
              min={0}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>옵션</label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 400,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={handleInStockToggle}
            />
            재고 있는 것만
          </label>
        </div>

        <button className="reset-button" onClick={handleResetFilters}>
          필터 초기화
        </button>
      </section>

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <section className="search-sort">
        <input
          type="search"
          placeholder="상품 검색..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select value={sortBy} onChange={handleSortChange}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
        >
          <option value="grid">그리드</option>
          <option value="list">리스트</option>
        </select>
      </section>

      {/* ─── 상품 그리드 ────────────────────────────────── */}
      <section
        className="product-grid"
        style={viewMode === 'list' ? { gridTemplateColumns: '1fr' } : undefined}
      >
        {productsQuery.products.length === 0 ? (
          <div className="empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          productsQuery.products.map((product) => {
            // ─── 검색어 하이라이팅 로직 인라인 ──────────
            const highlightMatch = (text: string) => {
              const parts = splitHighlightedText(text, searchQuery)
              let offset = 0

              return (
                <>
                  {parts.map((part) => {
                    const key = `${part.text}-${offset}`
                    offset += part.text.length

                    return part.isMatch ? (
                      <mark
                        key={key}
                        style={{ background: '#fff176', padding: 0 }}
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={key}>{part.text}</span>
                    )
                  })}
                </>
              )
            }

            // ─── 도메인 규칙 계산 ────────────────────────
            const discountRate = getDiscountRate(product)
            const formattedPrice = formatPrice(product.price)
            const formattedOriginal =
              product.originalPrice !== undefined
                ? formatPrice(product.originalPrice)
                : null
            const productIsAlmostSoldOut = isAlmostSoldOut(product)
            const productIsSoldOut = isSoldOut(product)
            const isHot = isHotDeal({ discountRate })
            const isBest = isBestSeller(product)
            const productIsFreeShipping = isFreeShipping(product)
            const isNew = isNewProduct(product)

            // ─── 위시리스트 여부 ────────────────────────
            const isWished = wishlist.includes(product.id)

            return (
              <article
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="image-wrap">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                  />
                  {discountRate > 0 && (
                    <span className="badge badge-discount">
                      {discountRate}% 할인
                    </span>
                  )}
                  {isNew && <span className="badge badge-new">NEW</span>}
                  {isHot && <span className="badge badge-hot">특가</span>}
                  {isBest && <span className="badge badge-best">BEST</span>}
                  {productIsSoldOut && (
                    <span className="badge badge-soldout">품절</span>
                  )}
                  {!productIsSoldOut && productIsAlmostSoldOut && (
                    <span className="badge badge-warning">품절 임박</span>
                  )}
                </div>

                <div className="card-body">
                  <h3 className="product-name">
                    {highlightMatch(product.name)}
                  </h3>
                  <div className="price-area">
                    {formattedOriginal && (
                      <span className="original-price">
                        {formattedOriginal}
                      </span>
                    )}
                    <span className="price">{formattedPrice}</span>
                    {productIsFreeShipping && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: '#2e7d32',
                          fontWeight: 600,
                        }}
                      >
                        무료배송
                      </span>
                    )}
                  </div>
                  <div className="rating-area">
                    <span className="rating">
                      ★ {product.rating.toFixed(1)}
                    </span>
                    <span className="review-count">
                      ({product.reviewCount.toLocaleString()})
                    </span>
                    <button
                      style={{
                        marginLeft: 'auto',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(product.id)
                      }}
                      aria-label="위시리스트 토글"
                    >
                      {isWished ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </section>

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {pageInfo.totalPages > 1 && (
        <nav className="pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            aria-label="첫 페이지"
          >
            «
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {pageInfo.pageNumbers.map((p) => (
            <button
              key={p}
              className={p === pagination.page ? 'active' : ''}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pageInfo.totalPages}
            aria-label="다음 페이지"
          >
            ›
          </button>
          <button
            onClick={() => handlePageChange(pageInfo.totalPages)}
            disabled={pagination.page === pageInfo.totalPages}
            aria-label="마지막 페이지"
          >
            »
          </button>
        </nav>
      )}

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {productsQuery.isLoading && productsQuery.products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  )
}
