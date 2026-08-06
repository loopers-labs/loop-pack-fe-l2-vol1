'use client';
import { Suspense } from 'react';
import { ProductCard } from '@/widgets/product-card';
import { useProductFilters } from '@/features/product-filters/model/useProductFilters';
import { ProductFiltersForm } from '@/features/product-filters/ui/ProductFiltersForm';

export function ProductListPage() {
  return (
    <Suspense>
      <ProductListContent />
    </Suspense>
  );
}

function ProductListContent() {
  const {
    filters,
    setFilters,
    searchInput,
    handleSearchChange,
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    totalPages,
  } = useProductFilters();

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <ProductFiltersForm
          searchInput={searchInput}
          onSearchChange={handleSearchChange}
          category={filters.category}
          onCategoryChange={(category) => setFilters({ category, page: 1 })}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ sort, page: 1 })}
        />
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        {isLoading && <p>로딩 중...</p>}

        {!data && isError && (
          <div className="week05-error">
            <p>오류가 발생했습니다.</p>
            <button type="button" onClick={() => void refetch()}>
              다시 시도
            </button>
          </div>
        )}

        {data && (
          <>
            {isFetching && <p aria-live="polite">갱신 중...</p>}
            {isError && (
              <div className="week05-error" role="alert">
                <p>갱신에 실패했습니다.</p>
                <button type="button" onClick={() => void refetch()}>
                  다시 시도
                </button>
              </div>
            )}

            <p>총 {data.totalCount}개</p>
            <div className="week05-grid">
              {data.products.length === 0 && <p>상품이 없습니다.</p>}
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <nav className="week05-pagination" aria-label="페이지 이동">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setFilters({ page: filters.page - 1 })}
              >
                이전
              </button>
              <span>
                {filters.page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({ page: filters.page + 1 })}
              >
                다음
              </button>
            </nav>
          </>
        )}
      </section>
    </>
  );
}