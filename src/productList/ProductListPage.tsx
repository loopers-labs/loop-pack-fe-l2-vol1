import { useState } from "react";
import "./ProductListPage.css";
import { useProductList } from "./hooks/useProductList";
import { useProductFilters } from "./hooks/useProductFilters";
import { useVisibleProducts } from "./hooks/useVisibleProducts";
import { usePersistentList } from "./hooks/usePersistentList";
import { PageHeader } from "./components/PageHeader";
import { FilterPanel } from "./components/FilterPanel";
import { SearchSortBar } from "./components/SearchSortBar";
import { AsyncBoundary } from "./components/AsyncBoundary";
import { ProductGrid } from "./components/ProductGrid";
import { Pagination } from "./components/Pagination";
import type { ViewMode } from "./types";

export function ProductListPage() {
  // ─── 필터,검색,페이지네이션 상태 & URL 동기화 ──────────────────────────────────────────
  const filters = useProductFilters();
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
    handlePageChange,
  } = filters;

  // ─── 위시리스트/최근 본 상품 (localStorage 동기화) ──────
  const wishlistStore = usePersistentList();

  // ─── 서버 상태 (필터가 적용된 전체 목록) ────────────────
  const { products, isLoading, error, refetch } = useProductList({
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
  });

  // ─── 파생값: 재고 필터 + 클라이언트 페이지네이션 ────────
  const { visibleProducts, totalCount, totalPages } = useVisibleProducts({
    products,
    inStockOnly,
    page,
  });

  // ─── 보기 모드 (UI 전용 로컬 상태) ──────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div className="product-list-page">
      <PageHeader
        totalCount={totalCount}
        wishlistCount={wishlistStore.wishlist.length}
      />

      <FilterPanel filters={filters} />

      <SearchSortBar
        filters={filters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ─── 상품 그리드 자리에만 로딩/에러 처리 ────────── */}
      <AsyncBoundary
        isLoading={isLoading && visibleProducts.length === 0}
        error={error}
        onRetry={refetch}
      >
        <ProductGrid
          products={visibleProducts}
          viewMode={viewMode}
          searchQuery={searchQuery}
          wishlistStore={wishlistStore}
        />
      </AsyncBoundary>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      {isLoading && visibleProducts.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
