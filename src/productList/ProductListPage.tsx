import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { CATEGORY_LABELS, PAGE_SIZE, SORT_LABELS } from './constants';
import { useProductFilters } from './hooks/useProductFilters';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import { useWishlist } from './hooks/useWishlist';
import { productListQueryOptions } from './services/productQueries';
import { CATEGORY_FILTER_VALUES, SORT_VALUES, type SortBy } from './types';
import './ProductListPage.css';

// ─────────────────────────────────────────────────────────
// 500줄+ 컴포넌트 — UI, 비즈니스 로직, API, 포맷, 도메인 규칙이 한 파일에
// ─────────────────────────────────────────────────────────

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ─── 위시리스트 / 최근 본 상품 (localStorage 동기화) ──────
  const wishlist = useWishlist();
  const recentlyViewed = useRecentlyViewed();

  // ─── 서버 상태 (TanStack Query) ─────────────────────────
  const {
    data: productListResponse,
    isFetching: isFetchingProducts,
    isError: hasProductsError,
    error: productsError,
  } = useQuery(
    productListQueryOptions({
      category,
      sortBy,
      searchQuery,
      page,
      size: PAGE_SIZE,
      minPrice,
      maxPrice,
    }),
  );

  const allProducts = productListResponse?.products ?? [];

  // "재고 있는 것만"은 서버 관심사가 아니므로 응답에서 파생
  const products = inStockOnly
    ? allProducts.filter((p) => p.stock > 0)
    : allProducts;

  const totalCount = productListResponse?.totalCount ?? 0;

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // ─── 페이지네이션 계산 (인라인) ─────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  // ─── 로딩/에러는 early return ───────────────────────────
  if (isFetchingProducts && products.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  if (hasProductsError) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {productsError?.message}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {totalCount.toLocaleString()}개의 상품
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
          <div className="price-range">
            <input
              type="number"
              placeholder="최소"
              value={minPrice ?? ''}
              onChange={(e) =>
                setFilter({
                  minPrice:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
              min={0}
            />
            <span>~</span>
            <input
              type="number"
              placeholder="최대"
              value={maxPrice ?? ''}
              onChange={(e) =>
                setFilter({
                  maxPrice:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
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
        <select
          value={sortBy}
          // TODO: as 제거
          onChange={(e) => setFilter({ sortBy: e.target.value as SortBy })}
        >
          {SORT_VALUES.map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
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
        {products.length === 0 ? (
          <div className="empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          products.map((product) => {
            // ─── 검색어 하이라이팅 로직 인라인 ──────────
            const highlightMatch = (text: string) => {
              if (!searchQuery) return <>{text}</>;
              const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));

              return (
                <>
                  {parts.map((part, i) =>
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                      <mark
                        key={i}
                        style={{ background: '#fff176', padding: 0 }}
                      >
                        {part}
                      </mark>
                    ) : (
                      part
                    ),
                  )}
                </>
              );
            };

            const {
              discountRate,
              formattedPrice,
              formattedOriginal,
              isSoldOut,
              isAlmostSoldOut,
              isHot,
              isBest,
              isFreeShipping,
              isNew,
            } = product;

            // ─── 위시리스트 여부 ────────────────────────
            const isWished = wishlist.isWished(product.id);

            return (
              <article
                key={product.id}
                className="product-card"
                onClick={() => recentlyViewed.markViewed(product.id)}
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
                  {isSoldOut && (
                    <span className="badge badge-soldout">품절</span>
                  )}
                  {!isSoldOut && isAlmostSoldOut && (
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
                    {isFreeShipping && (
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
                        e.stopPropagation();
                        wishlist.toggleWish(product.id);
                      }}
                      aria-label="위시리스트 토글"
                    >
                      {isWished ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {totalPages > 1 && (
        <nav className="pagination">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="첫 페이지"
          >
            «
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            aria-label="다음 페이지"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="마지막 페이지"
          >
            »
          </button>
        </nav>
      )}

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isFetchingProducts && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
