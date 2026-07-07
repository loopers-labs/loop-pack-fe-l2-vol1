// 이 파일의 책임: 훅들을 엮고 컴포넌트를 배치한다. 로직·API·포맷은 각 레이어에 있다.
import { useState } from "react";
import "./ProductListPage.css";
import type { ViewMode } from "./types";
import { useProductFilters } from "./hooks/useProductFilters";
import { useProducts } from "./hooks/useProducts";
import { useWishlist } from "./hooks/useWishlist";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useScrollToTopOnChange } from "./hooks/useScrollToTopOnChange";
import { useProductListUrlSync } from "./hooks/useProductListUrlSync";
import { derivePagination } from "./utils/pagination";
import { FilterPanel } from "./components/FilterPanel";
import { SearchSortBar } from "./components/SearchSortBar";
import { ProductGrid } from "./components/ProductGrid";
import { Pagination } from "./components/Pagination";

export function ProductListPage() {
  const {
    filters,
    selectCategory,
    changeMinPrice,
    changeMaxPrice,
    selectSort,
    search,
    toggleInStock,
    goToPage,
    reset,
    syncFromUrl,
  } = useProductFilters();

  // 보기 모드는 fetch에 영향 없는 순수 UI 상태라 훅으로 빼지 않고 여기 둔다.
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // page가 범위를 벗어나면(예: ?page=99) 응답 후 goToPage로 보정한다.
  const { products, totalCount, isLoading, error } = useProducts(filters, goToPage);

  const { wishlist, toggle: toggleWish, isWished } = useWishlist();
  const { add: recordView } = useRecentlyViewed();

  const { totalPages, pageNumbers } = derivePagination(filters.page, totalCount);

  useScrollToTopOnChange(filters.page);
  // URL ↔ 상태 양방향 동기화: 쓰기(replaceState) + 뒤로/앞으로(popstate) 시 되읽기.
  useProductListUrlSync(filters, syncFromUrl);

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
          {wishlist.length > 0 && <span> · 위시리스트 {wishlist.length}개</span>}
        </p>
      </header>

      <FilterPanel
        category={filters.category}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        inStockOnly={filters.inStockOnly}
        onSelectCategory={selectCategory}
        onChangeMinPrice={changeMinPrice}
        onChangeMaxPrice={changeMaxPrice}
        onToggleInStock={toggleInStock}
        onReset={reset}
      />

      <SearchSortBar
        searchQuery={filters.searchQuery}
        sortBy={filters.sortBy}
        viewMode={viewMode}
        onChangeSearch={search}
        onChangeSort={selectSort}
        onChangeViewMode={setViewMode}
      />

      <ProductGrid
        products={products}
        viewMode={viewMode}
        searchQuery={filters.searchQuery}
        isWished={isWished}
        onSelect={recordView}
        onToggleWish={toggleWish}
      />

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onChange={goToPage}
      />

      {isLoading && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
