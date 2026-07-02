import { useEffect } from "react";
import "./ProductListPage.css";
import { PAGE_SIZE } from "./constants";
import { getTotalPages } from "./utils";
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
import ProductCard from "./components/ProductCard";
import Pagination from "./components/Pagination";
import ProductListError from "./components/ProductListError";

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

  const { products, totalCount, isLoading, isFetching, error, refetch } =
    useProducts(query);
  const { wishlist, isWished, toggleWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  useSyncFiltersToUrl(filters);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters.page]);

  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  // 최초 로드(데이터 없음)에서만 전체화면 로딩. 재검색 중에는 keepPreviousData 로
  // 목록·검색창이 유지돼 입력 포커스를 잃지 않는다.
  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    // 전체 리로드(캐시·위시리스트·URL 동기화까지 초기화) 대신 해당 쿼리만 재요청한다.
    return <ProductListError error={error} onRetry={() => refetch()} />;
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

      <ProductGrid viewMode={filters.viewMode} isEmpty={products.length === 0}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            searchQuery={filters.searchQuery}
            isWished={isWished(product.id)}
            onToggleWishlist={toggleWishlist}
            onClick={addRecentlyViewed}
          />
        ))}
      </ProductGrid>

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
