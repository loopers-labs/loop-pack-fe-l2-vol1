import { useEffect, useState } from 'react';
import './ProductListPage.css';
import { PAGE_SIZE } from '../services/productApi';
import { useProducts } from '../hooks/useProducts';
import { useProductFilters } from '../hooks/useProductFilters';
import { useStoredIds } from '../hooks/useStoredIds';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { getTotalPages } from '../utils/pagination';
import { FilterPanel } from './FilterPanel';
import { SearchSortBar } from './SearchSortBar';
import { ProductGrid } from './ProductGrid';
import { Pagination } from './Pagination';

export function ProductListPage() {
  const filters = useProductFilters();
  const { data, isPending, error, refetch } = useProducts(filters.params);
  const products = data?.products ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [wishlist, setWishlist] = useStoredIds('wishlist');
  const { addRecentlyViewed } = useRecentlyViewed();

  const toggleWishlist = (id: number) =>
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters.values.page]);

  if (isPending && products.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error.message}</p>
        <button onClick={refetch}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <header className="page-header">
        <h1>상품 목록</h1>
        <p className="total-count">
          총 {totalCount.toLocaleString()}개의 상품
          {wishlist.length > 0 && (
            <span> · 위시리스트 {wishlist.length}개</span>
          )}
        </p>
      </header>

      <FilterPanel filters={filters} />
      <SearchSortBar
        filters={filters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <ProductGrid
        products={products}
        viewMode={viewMode}
        searchQuery={filters.params.searchQuery}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
        onProductClick={addRecentlyViewed}
      />
      <Pagination
        page={filters.values.page}
        totalPages={totalPages}
        onPageChange={filters.setPage}
      />

      {isPending && products.length > 0 && (
        <div className="background-loading">데이터 갱신 중...</div>
      )}
    </div>
  );
}
