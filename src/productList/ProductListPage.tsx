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
import { ProductListHeader } from "./components/ProductListHeader";
import { ProductListBackgroundLoading } from "./components/ProductListBackgroundLoading";

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

  const { products, totalCount, isLoading, error, refetch } = useProductList({
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

  const handleRetry = () => {
    void refetch();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="product-list-page">
      <ProductListHeader totalCount={totalCount} wishlistCount={wishlistCount} />

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
        isLoading={isLoading}
        error={error}
        isWishlisted={isWishlisted}
        onRetry={handleRetry}
        onProductClick={handleProductClick}
        onWishlistToggle={handleWishlistToggle}
      />

      <Pagination
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />

      {isLoading && products.length > 0 && <ProductListBackgroundLoading />}
    </div>
  );
}
