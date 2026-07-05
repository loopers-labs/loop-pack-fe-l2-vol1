import { Show } from '@ilokesto/utilinent'

import {
  useProductInteraction,
  useProductList,
  useProductListSearchParams,
} from '@/features/product-list'
import { useScrollToTopOnChange } from '@/shared/lib'
import { Pagination } from '@/shared/ui'
import {
  ProductGrid,
  ProductListFilterPanel,
  ProductListHeader,
  ProductListToolbar,
} from '@/widgets/product-list'

const PAGE_SIZE = 12

export function ProductListPage() {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
    viewMode,
    apiQueryString,
    filterInputSyncKey,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handleViewModeChange,
    handlePageChange,
    handleResetFilters,
  } = useProductListSearchParams({ pageSize: PAGE_SIZE })

  const { wishlist, handleWishlistToggle, handleProductClick } =
    useProductInteraction()
  const {
    isRefreshing,
    products,
    status: productListStatus,
    totalCount,
  } = useProductList({ apiQueryString })

  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useScrollToTopOnChange(page, { enabled: page > 0 })

  return (
    <div className="mx-auto max-w-300 p-6 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <ProductListHeader
        totalCount={totalCount}
        wishlistCount={wishlist.length}
      />

      <ProductListFilterPanel
        category={category}
        inStockOnly={inStockOnly}
        maxPrice={maxPrice}
        minPrice={minPrice}
        syncKey={filterInputSyncKey}
        onCategoryChange={handleCategoryChange}
        onInStockToggle={handleInStockToggle}
        onMaxPriceChange={handleMaxPriceChange}
        onMinPriceChange={handleMinPriceChange}
        onResetFilters={handleResetFilters}
      />

      <ProductListToolbar
        searchQuery={searchQuery}
        syncKey={filterInputSyncKey}
        sortBy={sortBy}
        viewMode={viewMode}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onViewModeChange={handleViewModeChange}
      />

      <ProductGrid
        products={products}
        searchQuery={searchQuery}
        status={productListStatus}
        viewMode={viewMode}
        wishlist={wishlist}
        onProductClick={handleProductClick}
        onWishlistToggle={handleWishlistToggle}
      />

      <Pagination
        currentPage={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      {/* ─── 백그라운드 로딩 인디케이터 ─────────────────── */}
      <Show when={isRefreshing}>
        <div className="fixed right-5 bottom-5 rounded-[20px] bg-black/75 px-3.5 py-2 text-xs text-white">
          데이터 갱신 중...
        </div>
      </Show>
    </div>
  )
}
