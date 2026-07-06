import { useState, useEffect } from 'react';

import { NumberRangeInput } from './components/NumberRangeInput';
import { Pagination } from './components/Pagination';
import { ProductCard } from './components/ProductCard';
import { Select } from './components/Select';
import { CATEGORY_LABELS, SORT_LABELS, VIEW_MODE_LABELS } from './constants';
import { useProductFilters } from './hooks/useProductFilters';
import { useProductList } from './hooks/useProductList';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import { useWishlist } from './hooks/useWishlist';
import {
  CATEGORY_FILTER_VALUES,
  SORT_VALUES,
  VIEW_MODES,
  type ViewMode,
} from './types';
import { formatNumber } from './utils';
import './ProductListPage.css';

export function ProductListPage() {
  // ─── 필터·검색·페이지 상태 ────────────
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    page,
    setFilter,
    setPage,
    resetFilter,
  } = useProductFilters();

  // ─── 보기 모드 (표시 전용 — 데이터 필터 아님) ───────────
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // ─── 위시리스트 / 최근 본 상품 (localStorage 동기화) ──────
  const wishlist = useWishlist();
  const recentlyViewed = useRecentlyViewed();

  // ─── 서버 상태 (TanStack Query) ─────────────────────────
  const {
    products,
    totalCount,
    totalPages,
    isFetching: isFetchingProducts,
    isPending: isLoadingProducts,
    isError: hasProductsError,
    error: productsError,
    refetch,
  } = useProductList({
    category,
    sortBy,
    searchQuery,
    page,
    minPrice,
    maxPrice,
    inStockOnly,
  });

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // ─── 초기 로딩·에러는 early return ──────────────────────
  if (isLoadingProducts) {
    return <div className="loading">로딩 중...</div>;
  }

  if (hasProductsError) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {productsError?.message}</p>
        <button onClick={() => void refetch()} disabled={isFetchingProducts}>
          {isFetchingProducts ? '재시도 중...' : '다시 시도'}
        </button>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {formatNumber(totalCount)}개의 상품
          {wishlist.count > 0 && <span> · 위시리스트 {wishlist.count}개</span>}
        </p>
      </header>

      {/* ─── 필터 패널 ──────────────────────────────────── */}
      <section className="filter-panel">
        <div className="filter-group">
          <label>카테고리</label>
          <div className="category-list">
            {CATEGORY_FILTER_VALUES.map((value) => (
              <button
                key={value}
                className={category === value ? 'active' : ''}
                onClick={() => setFilter({ category: value })}
              >
                {CATEGORY_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>가격 범위</label>
          <NumberRangeInput
            minValue={minPrice === null ? '' : String(minPrice)}
            maxValue={maxPrice === null ? '' : String(maxPrice)}
            onMinValueChange={(value) =>
              setFilter({ minPrice: value === '' ? null : Number(value) })
            }
            onMaxValueChange={(value) =>
              setFilter({ maxPrice: value === '' ? null : Number(value) })
            }
          />
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
              onChange={(e) => setFilter({ inStockOnly: e.target.checked })}
            />
            재고 있는 것만
          </label>
        </div>

        <button className="reset-button" onClick={resetFilter}>
          필터 초기화
        </button>
      </section>

      {/* ─── 검색 + 정렬 + 보기 모드 ───────────────────── */}
      <section className="search-sort">
        <input
          type="search"
          placeholder="상품 검색..."
          value={searchQuery}
          onChange={(e) => setFilter({ searchQuery: e.target.value })}
          className="search-input"
        />
        <Select
          value={sortBy}
          options={SORT_VALUES}
          labels={SORT_LABELS}
          onChange={(value) => setFilter({ sortBy: value })}
        />
        <Select
          value={viewMode}
          options={VIEW_MODES}
          labels={VIEW_MODE_LABELS}
          onChange={setViewMode}
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
            <ProductCard
              key={product.id}
              product={product}
              nameHighlightWord={searchQuery}
              onSelect={() => recentlyViewed.markViewed(product.id)}
              trailingAction={
                <button
                  className="wish-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    wishlist.toggleWish(product.id);
                  }}
                  aria-label="위시리스트 토글"
                >
                  {wishlist.isWished(product.id) ? '♥' : '♡'}
                </button>
              }
            />
          ))
        )}
      </section>

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isFetchingProducts && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
