import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import "./ProductListPage.css";
import { useProductFilters } from "./useProductFilters";
import { useProductList } from "./useProductList";
import { useWishlist } from "./useWishlist";
import { useRecentlyViewed } from "./useRecentlyViewed";
import { useDebouncedValue } from "./useDebouncedValue";
import { FilterPanel } from "./FilterPanel";
import { SearchSortBar, type ViewMode } from "./SearchSortBar";
import { ProductGrid } from "./ProductGrid";
import { Pagination } from "./Pagination";
import { ErrorBanner } from "./ErrorBanner";
import type { ProductListParams } from "./api/productApi";

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 300;

export function ProductListPage() {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    page,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSearchQuery,
    setInStockOnly,
    setPage,
    reset,
  } = useProductFilters();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // ─── 텍스트 필드만 debounce — category/sortBy/page/inStockOnly는 즉시 반영 ──
  const debouncedSearch = useDebouncedValue(searchQuery, DEBOUNCE_MS);
  const debouncedMinPrice = useDebouncedValue(minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebouncedValue(maxPrice, DEBOUNCE_MS);

  // ─── 서버 요청 params 조립 — deps가 전부 원시값이라 참조가 안정적이다 ──
  const params = useMemo<ProductListParams>(
    () => ({
      category,
      sortBy,
      searchQuery: debouncedSearch,
      page,
      pageSize: PAGE_SIZE,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
      inStockOnly,
    }),
    [category, debouncedSearch, sortBy, page, debouncedMinPrice, debouncedMaxPrice, inStockOnly],
  );

  const { products, totalCount, status, error, refetch } = useProductList(params);
  const { wishlist, toggle: toggleWishlist } = useWishlist();
  const { add: addRecentlyViewed } = useRecentlyViewed();

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleMinPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMinPrice(v === "" ? "" : Number(v));
  };

  const handleMaxPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMaxPrice(v === "" ? "" : Number(v));
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInStockToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(e.target.checked);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ─── cold 로딩만 전체화면 early-return — warm 로딩은 ProductGrid가 담당 ──
  if (status === "loading" && products.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {totalCount.toLocaleString()}개의 상품
          {wishlist.length > 0 && <span> · 위시리스트 {wishlist.length}개</span>}
        </p>
      </header>

      <FilterPanel
        category={category}
        onCategoryChange={setCategory}
        minPrice={minPrice}
        onMinPriceChange={handleMinPriceChange}
        maxPrice={maxPrice}
        onMaxPriceChange={handleMaxPriceChange}
        inStockOnly={inStockOnly}
        onInStockToggle={handleInStockToggle}
        onReset={reset}
      />

      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {status === "error" ? (
        <ErrorBanner
          message={error?.message ?? "알 수 없는 오류가 발생했습니다."}
          onRetry={refetch}
        />
      ) : (
        <>
          <ProductGrid
            products={products}
            viewMode={viewMode}
            isLoading={status === "loading"}
            highlightQuery={debouncedSearch}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onProductClick={addRecentlyViewed}
          />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
