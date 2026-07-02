import { useMemo, useState } from "react";
import "./ProductListPage.css";
import { useProductList } from "./hooks/useProductList";
import { useProductFilters } from "./hooks/useProductFilters";
import { usePersistentList } from "./hooks/usePersistentList";
import { PageHeader } from "./components/PageHeader";
import { FilterPanel } from "./components/FilterPanel";
import { SearchSortBar } from "./components/SearchSortBar";
import { ProductGrid } from "./components/ProductGrid";
import { Pagination } from "./components/Pagination";
import { PAGE_SIZE } from "./constants";
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

  // ─── 서버 상태 ──────────────────────────────────────────
  const { products, totalCount, isLoading, error } = useProductList({
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
  });

  // ─── 보기 모드 (UI 전용 로컬 상태) ──────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const visibleProducts = useMemo(
    () => (inStockOnly ? products.filter((p) => p.stock > 0) : products),
    [products, inStockOnly],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ─── 로딩/에러는 early return ───────────────────────────
  if (isLoading && visibleProducts.length === 0) {
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

      <ProductGrid
        products={visibleProducts}
        viewMode={viewMode}
        searchQuery={searchQuery}
        wishlistStore={wishlistStore}
      />

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
