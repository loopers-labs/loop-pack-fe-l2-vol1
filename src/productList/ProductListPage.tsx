import { useState, useEffect } from 'react';
import './ProductListPage.css';
import type { Product, ProductListResponse } from './type';
import {
  useProductFilter,
  CATEGORIES,
  SORT_OPTIONS,
  PAGE_SIZE,
  PAGE_WINDOW,
} from './hooks/useProductFilter';
const RECENTLY_VIEWED_MAX = 10;
const ALMOST_SOLD_OUT_THRESHOLD = 5;
const HOT_DISCOUNT_THRESHOLD = 30;
const BEST_RATING_THRESHOLD = 4.5;
const BEST_REVIEW_THRESHOLD = 100;
const FREE_SHIPPING_THRESHOLD = 50000;
const MS_PER_DAY = 86400000;
const PERCENT = 100;
const NEW_PRODUCT_DAYS = 7;

// 0701 - utills 넣기 일반 함수
// 검색어를 정규식에 안전하게 넣기 위한 escape (특수문자로 인한 RegExp 크래시 방지)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────
// 500줄+ 컴포넌트 — UI, 비즈니스 로직, API, 포맷, 도메인 규칙이 한 파일에
// ─────────────────────────────────────────────────────────

export function ProductListPage() {
  // 0701 - useProductList.ts
  // ─── 서버 상태 (직접 관리) ──────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    category,
    setCategory,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    inStockOnly,
    setInStockOnly,
  } = useProductFilter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ─── 위시리스트 (localStorage 동기화) ───────────────────
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ─── 최근 본 상품 (localStorage 동기화) ─────────────────
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('recentlyViewed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 0701 서버 상태 조합 useProductList + API호출 - productService
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        category,
        sort: sortBy,
        q: searchQuery,
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (minPrice !== '') params.set('minPrice', String(minPrice));
      if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
      if (inStockOnly) params.set('inStock', 'true');
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
        const data: ProductListResponse = await res.json();
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProducts();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly]);

  // ─── 위시리스트가 바뀔 때마다 localStorage 동기화 ───────
  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [wishlist]);

  // ─── 최근 본 상품도 localStorage 동기화 ─────────────────
  useEffect(() => {
    try {
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [recentlyViewed]);

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handleCategoryChange = (cat: 'all' | Product['category']) => {
    setCategory(cat);
    setPage(1);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMinPrice(v === '' ? '' : Number(v));
    setPage(1);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMaxPrice(v === '' ? '' : Number(v));
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(e.target.checked);
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleResetFilters = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
    setSearchQuery('');
    setInStockOnly(false);
    setPage(1);
  };

  const handleWishlistToggle = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleProductClick = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, RECENTLY_VIEWED_MAX);
    });
  };

  // ─── 페이지네이션 계산 (인라인) ─────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, page - PAGE_WINDOW);
  const endPage = Math.min(totalPages, page + PAGE_WINDOW);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  // ─── 로딩/에러는 early return ───────────────────────────
  if (isLoading && products.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error.message}</p>
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
        {products.length === 0 ? (
          <div className="empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          products.map((product) => {
            // ─── 검색어 하이라이팅 로직 인라인 ──────────
            const highlightMatch = (text: string) => {
              if (!searchQuery) return <>{text}</>;
              const parts = text.split(
                new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'),
              );
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

            // ─── 도메인 규칙 인라인 계산 ─────────────────
            const discountRate = product.originalPrice
              ? Math.round(
                  (1 - product.price / product.originalPrice) * PERCENT,
                )
              : 0;
            const formattedPrice = `${product.price.toLocaleString()}원`;
            const formattedOriginal = product.originalPrice
              ? `${product.originalPrice.toLocaleString()}원`
              : null;
            const isAlmostSoldOut =
              product.stock > 0 && product.stock <= ALMOST_SOLD_OUT_THRESHOLD;
            const isSoldOut = product.stock === 0;
            const isHot = discountRate >= HOT_DISCOUNT_THRESHOLD;
            const isBest =
              product.rating >= BEST_RATING_THRESHOLD &&
              product.reviewCount >= BEST_REVIEW_THRESHOLD;
            const isFreeShipping = product.price >= FREE_SHIPPING_THRESHOLD;

            // ─── 날짜 포맷팅 인라인 ─────────────────────
            const createdDate = new Date(product.createdAt);
            const now = new Date();
            const daysSinceCreated = Math.floor(
              (now.getTime() - createdDate.getTime()) / MS_PER_DAY,
            );
            const isNew = daysSinceCreated <= NEW_PRODUCT_DAYS;

            // ─── 위시리스트 여부 ────────────────────────
            const isWished = wishlist.includes(product.id);

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
                        handleWishlistToggle(product.id);
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
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            aria-label="첫 페이지"
          >
            «
          </button>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="다음 페이지"
          >
            ›
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            aria-label="마지막 페이지"
          >
            »
          </button>
        </nav>
      )}

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isLoading && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
