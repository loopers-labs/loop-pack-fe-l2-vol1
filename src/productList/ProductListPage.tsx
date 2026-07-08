import { useState } from 'react';
import './ProductListPage.css';
import type { SortBy, ViewMode } from './shared';
import { useProducts } from './services/useProducts';
import { useLocalStorage } from '../shared/hooks/useLocalStorage';
import { useScrollZero } from '../shared/hooks/useScrollZero';
import { LoadingView } from './components/skeleton/LoadingView';
import { ErrorView } from './components/skeleton/ErrorView';
import { Category } from './components/filter/Category';
import { PriceRange } from './components/filter/PriceRange';
import { Option } from './components/filter/Option';
import { Dropdown } from './components/search-sort/Dropdown';
import { Product } from './components/products/Product';
import { Pagination } from './components/pagination/Pagination';
import { useProductFilter } from './hooks/useProductFilter';

// ─────────────────────────────────────────────────────────
// 카테고리 / 정렬 옵션 — 컴포넌트 안에 들고 다닌다
// ─────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
];

const VIEWMODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'grid', label: '그리드' },
  { value: 'list', label: '리스트' },
];

// 직관적인 네이밍으로 수정
const ITEMS_PER_PAGE = 12;

// ─────────────────────────────────────────────────────────
// 500줄+ 컴포넌트 — UI, 비즈니스 로직, API, 포맷, 도메인 규칙이 한 파일에
// ────────────────────────────────────────────────────────-

export function ProductListPage() {
  // 필터/검색 결과에 영향을 미치는 상태들을 커스텀 훅으로 분리
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
    searchInput,
    minPriceInput,
    maxPriceInput,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handlePageChange,
    handleResetFilters,
  } = useProductFilter();

  const searchParamsObj = {
    category,
    sortBy,
    searchQuery,
    itemsPerPage: ITEMS_PER_PAGE,
    page,
    minPrice,
    maxPrice,
    inStockOnly,
  };

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [wishlist, setWishlist] = useLocalStorage<number[]>('wishlist', []);
  const [, setRecentlyViewed] = useLocalStorage<number[]>('recentlyViewed', []);

  const { products, totalCount, isLoading, error, setRetryCount } = useProducts(searchParamsObj);

  useScrollZero(page);

  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // AI로 as 타입 단언 해결
    const value = e.target.value;
    if (value === 'grid' || value === 'list') {
      setViewMode(value);
    }
  };
  const handleWishlistToggle = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleProductClick = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, 10);
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  // ─── 로딩/에러는 early return ───────────────────────────
  if (isLoading && products.length === 0) {
    return <LoadingView>로딩 중...</LoadingView>;
  }

  if (error) {
    return (
      <ErrorView>
        <p>오류가 발생했습니다: {error.message}</p>
        <button onClick={() => setRetryCount((prev) => prev + 1)}>다시 시도</button>
      </ErrorView>
    );
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {totalCount.toLocaleString()}개의 상품
          {wishlist.length > 0 && <span> · 위시리스트 {wishlist.length}개</span>}
        </p>
      </header>

      {/* ─── 필터 패널 ──────────────────────────────────── */}
      <section className="filter-panel">
        <Category selectedCategory={category} onCategoryChange={handleCategoryChange} />
        <PriceRange
          minPrice={minPriceInput}
          maxPrice={maxPriceInput}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
        />
        <Option inStockOnly={inStockOnly} onStockCheckboxToggle={handleInStockToggle} />
        <button className="reset-button" onClick={handleResetFilters}>
          필터 초기화
        </button>
      </section>

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <section className="search-sort">
        <input
          type="search"
          placeholder="상품 검색..."
          value={searchInput}
          onChange={handleSearchChange}
          className="search-input"
        />
        <Dropdown value={sortBy} onOptionChange={handleSortChange} options={SORT_OPTIONS} />
        <Dropdown
          value={viewMode}
          onOptionChange={handleViewModeChange}
          options={VIEWMODE_OPTIONS}
        />
      </section>

      {/* ─── 상품 그리드 ────────────────────────────────── */}
      <section
        className="product-grid"
        style={viewMode === 'list' ? { gridTemplateColumns: '1fr' } : undefined}
      >
        {products.length === 0 ? (
          <div className="empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          products.map((product) => (
            <Product
              key={product.id}
              product={product}
              searchQuery={searchQuery}
              isWished={wishlist.includes(product.id)}
              onProductClick={handleProductClick}
              onWishlistToggle={handleWishlistToggle}
            />
          ))
        )}
      </section>

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isLoading && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
