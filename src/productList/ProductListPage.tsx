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
import { ProductGrid } from "./components/ProductGrid";

const PAGE_SIZE = 12;

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

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleWishlistToggle = (productId: number) => {
    toggleWishlist(productId);
  };

  const handleProductClick = (productId: number) => {
    addRecentlyViewedProduct(productId);
  };

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

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

      <ProductGrid
        products={products}
        searchQuery={searchQuery}
        viewMode={viewMode}
        isWishlisted={isWishlisted}
        onProductClick={handleProductClick}
        onWishlistToggle={handleWishlistToggle}
      />

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
