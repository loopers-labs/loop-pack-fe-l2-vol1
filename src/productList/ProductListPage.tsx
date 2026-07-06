import { useState, useEffect } from "react";
import "./ProductListPage.css";
import type { ViewMode } from "./types";
import { useProductListQuery } from "./hooks/useProductListQuery";
import { useProductListQueryParams } from "./hooks/useProductListQueryParams";
import { useWishlist } from "./hooks/useWishlist";
import { useRecentlyViewedProducts } from "./hooks/useRecentlyViewedProducts";
import { Pagination } from "./components/Pagination";
import { ProductFilters } from "./components/ProductFilters";
import { ProductListToolbar } from "./components/ProductListToolbar";
import { ProductGrid } from "./components/ProductGrid";
import { ProductListHeader } from "./components/ProductListHeader";
import { ProductListBackgroundLoading } from "./components/ProductListBackgroundLoading";
import { ProductListContent } from "./components/ProductListContent";

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

  const { products, totalCount, isInitialLoading, isBackgroundLoading, error, refetch } =
    useProductListQuery({
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

  useEffect(() => {
    if (isInitialLoading || error || page <= totalPages) {
      return;
    }

    setPage(totalPages, "replace");
  }, [error, isInitialLoading, page, setPage, totalPages]);

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

      <ProductListContent
        isInitialLoading={isInitialLoading}
        isEmpty={products.length === 0}
        error={error}
        onRetry={handleRetry}
      >
        <ProductGrid
          products={products}
          searchQuery={searchQuery}
          viewMode={viewMode}
          isWishlisted={isWishlisted}
          onProductClick={handleProductClick}
          onWishlistToggle={handleWishlistToggle}
        />
      </ProductListContent>

      <Pagination
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />

      {isBackgroundLoading && <ProductListBackgroundLoading />}
    </div>
  );
}
