import { useEffect } from "react";
import "./ProductListPage.css";
import { PAGE_SIZE } from "./constants";
import { getTotalPages, getVisibleProducts } from "./utils";
import { useProductFilters } from "./hooks/useProductFilters";
import { useProducts } from "./hooks/useProducts";
import { useWishlist } from "./hooks/useWishlist";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useSyncFiltersToUrl } from "./hooks/useSyncFiltersToUrl";
import ProductListHeader from "./components/ProductListHeader";
import FilterPanel from "./components/filter/FilterPanel";
import CategoryFilter from "./components/filter/CategoryFilter";
import PriceRangeFilter from "./components/filter/PriceRangeFilter";
import InStockToggle from "./components/filter/InStockToggle";
import SearchSortBar from "./components/searchSort/SearchSortBar";
import SearchInput from "./components/searchSort/SearchInput";
import SortSelect from "./components/searchSort/SortSelect";
import ViewModeSelect from "./components/searchSort/ViewModeSelect";
import ProductGrid from "./components/ProductGrid";
import Pagination from "./components/Pagination";
import ProductListError from "./components/ProductListError";

// ─────────────────────────────────────────────────────────
// 타입도 한 파일에 (실무에서 흔히 보는 모습)
// ─────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  category: "electronics" | "fashion" | "home" | "beauty";
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};

type ProductListResponse = {
  products: Product[];
  totalCount: number;
};

type SortBy = "latest" | "popular" | "price-asc" | "price-desc";

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

// 검색어를 정규식에 안전하게 넣기 위한 escape (특수문자로 인한 RegExp 크래시 방지)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─────────────────────────────────────────────────────────
// 500줄+ 컴포넌트 — UI, 비즈니스 로직, API, 포맷, 도메인 규칙이 한 파일에
// ─────────────────────────────────────────────────────────

export function ProductListPage() {
  const {
    filters,
    query,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handleViewModeChange,
    handlePageChange,
    handleResetFilters,
  } = useProductFilters();

  const { products, totalCount, isLoading, isFetching, error } =
    useProducts(query);
  const { wishlist, isWished, toggleWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  useSyncFiltersToUrl(filters);

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
      if (minPrice !== "") params.set("minPrice", String(minPrice));
      if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
      if (inStockOnly) params.set("inStock", "true");
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
        const data: ProductListResponse = await res.json();
        setProducts(data.products);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly]);

  // ─── 위시리스트가 바뀔 때마다 localStorage 동기화 ───────
  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [wishlist]);

  // ─── 최근 본 상품도 localStorage 동기화 ─────────────────
  useEffect(() => {
    try {
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [recentlyViewed]);

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters.page]);

  const visibleProducts = getVisibleProducts(products, filters.inStockOnly);
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  // 최초 로드(데이터 없음)에서만 전체화면 로딩. 재검색 중에는 keepPreviousData 로
  // 목록·검색창이 유지돼 입력 포커스를 잃지 않는다.
  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <ProductListError
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="product-list-page">
      <ProductListHeader
        totalCount={totalCount}
        wishlistCount={wishlist.length}
      />

      <FilterPanel onReset={handleResetFilters}>
        <CategoryFilter
          category={filters.category}
          onCategoryChange={handleCategoryChange}
        />
        <PriceRangeFilter
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
        />
        <InStockToggle
          inStockOnly={filters.inStockOnly}
          onInStockToggle={handleInStockToggle}
        />
      </FilterPanel>

      <SearchSortBar>
        <SearchInput
          searchQuery={filters.searchQuery}
          onSearchChange={handleSearchChange}
        />
        <SortSelect sortBy={filters.sortBy} onSortChange={handleSortChange} />
        <ViewModeSelect
          viewMode={filters.viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </SearchSortBar>

      <ProductGrid
        products={visibleProducts}
        viewMode={filters.viewMode}
        searchQuery={filters.searchQuery}
        isWished={isWished}
        onToggleWishlist={toggleWishlist}
        onProductClick={addRecentlyViewed}
      />

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
          onChange={(e) => {
            if (isViewMode(e.target.value)) setViewMode(e.target.value);
          }}
        >
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
              const parts = text.split(
                new RegExp(`(${escapeRegExp(searchQuery)})`, "gi"),
              );
              return (
                <>
                  {parts.map((part, i) =>
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                      <mark
                        key={i}
                        style={{ background: "#fff176", padding: 0 }}
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
                          color: "#2e7d32",
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

      {/* ─── 페이지네이션 ───────────────────────────────── */}
      {totalPages > 1 && (
        <Pagination
          page={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {isFetching && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
