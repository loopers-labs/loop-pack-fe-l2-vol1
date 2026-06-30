import { useState, useEffect } from "react";
import "./ProductListPage.css";
import type { Product, SortBy } from "./types";
import { useProductList } from "./hooks/useProductList";
import { useProductListQueryParams } from "./hooks/useProductListQueryParams";
import { useWishlist } from "./hooks/useWishlist";
import { useRecentlyViewedProducts } from "./hooks/useRecentlyViewedProducts";
import { Pagination } from "./components/Pagination";

// ─────────────────────────────────────────────────────────
// 카테고리 / 정렬 옵션 — 컴포넌트 안에 들고 다닌다
// ─────────────────────────────────────────────────────────

const CATEGORIES: { value: "all" | Product["category"]; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "electronics", label: "전자제품" },
  { value: "fashion", label: "패션" },
  { value: "home", label: "홈" },
  { value: "beauty", label: "뷰티" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

const PAGE_SIZE = 12;

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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { wishlistCount, toggleWishlist, isWishlisted } = useWishlist();

  const { addRecentlyViewedProduct } = useRecentlyViewedProducts();

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleCategoryChange = (cat: "all" | Product["category"]) => {
    setCategory(cat);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMinPrice(v === "" ? "" : Number(v));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMaxPrice(v === "" ? "" : Number(v));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(e.target.checked);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleResetFilters = () => {
    resetQueryParams();
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

      {/* ─── 필터 패널 ──────────────────────────────────── */}
      <section className="filter-panel">
        <div className="filter-group">
          <label>카테고리</label>
          <div className="category-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={category === cat.value ? "active" : ""}
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
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 400,
              fontSize: 13,
            }}
          >
            <input type="checkbox" checked={inStockOnly} onChange={handleInStockToggle} />
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
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value as "grid" | "list")}>
          <option value="grid">그리드</option>
          <option value="list">리스트</option>
        </select>
      </section>

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
              const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
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
