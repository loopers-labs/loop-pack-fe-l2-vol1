import { useEffect, useState } from 'react';

import './ProductListPage.css';
import CategoryFilter from './components/CategoryFilter';
import Pagination from './components/Pagination';
import PriceFilter from './components/PriceFilter';
import ProductCard from './components/ProductCard';
import ProductGrid from './components/ProductGrid';
import SearchSortBar from './components/SearchSortBar';
import StockFilter from './components/StockFilter';
import ViewModeToggle, { type ViewMode } from './components/ViewModeToggle';
import type { SortBy } from './dto';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { usePagination } from './hooks/usePagination';
import { useProductFilters } from './hooks/useProductFilters';
import { useProducts } from './hooks/useProducts';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import { useScrollToTop } from './hooks/useScrollToTop';
import { useWishlist } from './hooks/useWishlist';
import type { ProductCategory } from './types';

const PAGE_SIZE = 12;

/**
 * 처음에는 useState 인라인 상태로 작성했지만,
 */
const getInitialPage = () => Number(new URLSearchParams(window.location.search).get('page')) || 1;

/**
 * 상품 목록 페이지 — 조합(조립) 레이어
 * - 과제: 분리 전에는 UI / 비즈니스 로직 / API 호출 / 데이터 포맷이 한 파일에 혼재하는 God Component였고, 이를 관심사와 목적에 맞게 분리하는 것이 과제였습니다.
 * - 분리 근거: 서버상태와 클라이언트 상태를 분리하고, 분리하는 과정에서 하나의 모듈이 외부 모듈을 강하게 의존하지 않는 DIP 원칙을 준수하였습니다.
 *   Page 컴포넌트는 최대한 렌더링만 담당하게 구성하기 위해, 대표적인 세 가지 고민과 기준은 아래와 같습니다.
 *
 * 1. 다른 사람이 볼 때, Page 컴포넌트 코드가 한 번에 읽힐 수 있게 하기
 * 2. 상태를 누가 소유해야 할지 결정하기 (useState 사용 유무 / Context 사용 여부 / 파생 상태)
 * 3. 함께 변하는 상태이며, 분리해야한다면 하나의 커스텀 훅으로 분리하기
 */
export function ProductListPage() {
  const { page, handlePageChange } = usePagination(getInitialPage());

  useScrollToTop(page);

  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSearchQuery,
    setInStockOnly,
    resetFilters,
  } = useProductFilters();

  // 타이핑형 입력(검색·가격)은 fetch로 가는 값만 디바운스한다 — input 표시는 즉시 반영.
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const debouncedMinPrice = useDebouncedValue(minPrice, 300);
  const debouncedMaxPrice = useDebouncedValue(maxPrice, 300);

  // ─── 서버 상태 (직접 관리) ──────────────────────────────
  const { products, totalCount, isLoading, error, refetch } = useProducts({
    category,
    sort: sortBy,
    q: debouncedSearchQuery,
    page,
    size: PAGE_SIZE,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    inStock: inStockOnly,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { wishlist, toggleWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  // 페이지 컴포넌트에서 분리하고 싶었지만, 단순 로직을 이관하는 냄새가 나서 여기에 남겨두었습니다.

  useEffect(() => {
    const params = new URLSearchParams();

    if (category !== 'all') params.set('category', category);
    if (searchQuery) params.set('q', searchQuery);
    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'latest') params.set('sort', sortBy);
    if (minPrice !== '') params.set('minPrice', String(minPrice));
    if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
    if (inStockOnly) params.set('inStock', 'true');

    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly]);

  const handleCategoryChange = (cat: 'all' | ProductCategory) => {
    setCategory(cat);
    handlePageChange(1);
  };

  const handleMinPriceChange = (value: number | '') => {
    setMinPrice(value);
    handlePageChange(1);
  };

  const handleMaxPriceChange = (value: number | '') => {
    setMaxPrice(value);
    handlePageChange(1);
  };

  const handleSortChange = (value: SortBy) => {
    setSortBy(value);
    handlePageChange(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handlePageChange(1);
  };

  const handleInStockToggle = (checked: boolean) => {
    setInStockOnly(checked);
    handlePageChange(1);
  };

  const handleResetFilters = () => {
    resetFilters();
    handlePageChange(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
        <CategoryFilter value={category} onChange={handleCategoryChange} />
        <PriceFilter
          min={minPrice}
          max={maxPrice}
          onMinChange={handleMinPriceChange}
          onMaxChange={handleMaxPriceChange}
        />
        <StockFilter checked={inStockOnly} onChange={handleInStockToggle} />

        <button className="reset-button" onClick={handleResetFilters}>
          필터 초기화
        </button>
      </section>

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      >
        <ViewModeToggle value={viewMode} onViewModeChange={setViewMode} />
      </SearchSortBar>

      {/* ─── 상품 그리드 ────────────────────────────────── */}
      <ProductGrid products={products} isLoading={isLoading} error={error} viewMode={viewMode} onRetry={refetch}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            searchQuery={searchQuery}
            isWished={wishlist.includes(product.id)}
            onClick={addRecentlyViewed}
            onWishlistToggle={toggleWishlist}
          />
        ))}
      </ProductGrid>

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />}
    </div>
  );
}
