import { useState, useEffect } from "react";
import "./ProductListPage.css";
import type { ViewMode } from "./types";
import { useProductList } from "./hooks/useProductList";
import { useProductListQueryParams } from "./hooks/useProductListQueryParams";
import { useWishlist } from "./hooks/useWishlist";
import { useRecentlyViewedProducts } from "./hooks/useRecentlyViewedProducts";
import { Pagination } from "./components/Pagination";
import { ProductFilters } from "./components/ProductFilters";
import { ProductListToolbar } from "./components/ProductListToolbar";

const PAGE_SIZE = 12;

// 검색어를 정규식에 안전하게 넣기 위한 escape (특수문자로 인한 RegExp 크래시 방지)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─────────────────────────────────────────────────────────
// 500줄+ 컴포넌트 — UI, 비즈니스 로직, API, 포맷, 도메인 규칙이 한 파일에
// ─────────────────────────────────────────────────────────

export function ProductListPage() {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSearchQuery,
    setPage,
    setInStockOnly,
    resetQueryParams,
  } = useProductListQueryParams();

  const { products, totalCount, isLoading, error } = useProductList({
    category,
    q: searchQuery,
    page,
    sort: sortBy,
    minPrice,
    maxPrice,
    size: PAGE_SIZE,
    inStockOnly,
  });

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { wishlistCount, toggleWishlist, isWishlisted } = useWishlist();

  const { addRecentlyViewedProduct } = useRecentlyViewedProducts();

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleWishlistToggle = (productId: number) => {
    toggleWishlist(productId);
  };

  const handleProductClick = (productId: number) => {
    addRecentlyViewedProduct(productId);
  };

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
          {wishlistCount > 0 && <span> · 위시리스트 {wishlistCount}개</span>}
        </p>
      </header>

      <ProductFilters
        category={category}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStockOnly={inStockOnly}
        onCategoryChange={setCategory}
        onInStockOnlyChange={setInStockOnly}
        onMaxPriceChange={setMaxPrice}
        onMinPriceChange={setMinPrice}
        onReset={resetQueryParams}
      />

      <ProductListToolbar
        searchQuery={searchQuery}
        sortBy={sortBy}
        viewMode={viewMode}
        onSearchQueryChange={setSearchQuery}
        onSortChange={setSortBy}
        onViewModeChange={setViewMode}
      />

      {/* ─── 상품 그리드 ────────────────────────────────── */}
      <section
        className="product-grid"
        style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : undefined}
      >
        {products.length === 0 ? (
          <div className="empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          products.map((product) => {
            // ─── 검색어 하이라이팅 로직 인라인 ──────────
            const highlightMatch = (text: string) => {
              if (!searchQuery) return <>{text}</>;
              const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, "gi"));
              return (
                <>
                  {parts.map((part, i) =>
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                      <mark key={i} style={{ background: "#fff176", padding: 0 }}>
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
              ? Math.round((1 - product.price / product.originalPrice) * 100)
              : 0;
            const formattedPrice = product.price.toLocaleString() + "원";
            const formattedOriginal = product.originalPrice
              ? product.originalPrice.toLocaleString() + "원"
              : null;
            const isAlmostSoldOut = product.stock > 0 && product.stock <= 5;
            const isSoldOut = product.stock === 0;
            const isHot = discountRate >= 30;
            const isBest = product.rating >= 4.5 && product.reviewCount >= 100;
            const isFreeShipping = product.price >= 50000;

            // ─── 날짜 포맷팅 인라인 ─────────────────────
            const createdDate = new Date(product.createdAt);
            const now = new Date();
            const daysSinceCreated = Math.floor(
              (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            const isNew = daysSinceCreated <= 7;

            // ─── 위시리스트 여부 ────────────────────────
            const isWished = isWishlisted(product.id);

            return (
              <article
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="image-wrap">
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  {discountRate > 0 && (
                    <span className="badge badge-discount">{discountRate}% 할인</span>
                  )}
                  {isNew && <span className="badge badge-new">NEW</span>}
                  {isHot && <span className="badge badge-hot">특가</span>}
                  {isBest && <span className="badge badge-best">BEST</span>}
                  {isSoldOut && <span className="badge badge-soldout">품절</span>}
                  {!isSoldOut && isAlmostSoldOut && (
                    <span className="badge badge-warning">품절 임박</span>
                  )}
                </div>

                <div className="card-body">
                  <h3 className="product-name">{highlightMatch(product.name)}</h3>
                  <div className="price-area">
                    {formattedOriginal && (
                      <span className="original-price">{formattedOriginal}</span>
                    )}
                    <span className="price">{formattedPrice}</span>
                    {isFreeShipping && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "#2e7d32",
                          fontWeight: 600,
                        }}
                      >
                        무료배송
                      </span>
                    )}
                  </div>
                  <div className="rating-area">
                    <span className="rating">★ {product.rating.toFixed(1)}</span>
                    <span className="review-count">({product.reviewCount.toLocaleString()})</span>
                    <button
                      style={{
                        marginLeft: "auto",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistToggle(product.id);
                      }}
                      aria-label="위시리스트 토글"
                    >
                      {isWished ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <Pagination
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isLoading && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
