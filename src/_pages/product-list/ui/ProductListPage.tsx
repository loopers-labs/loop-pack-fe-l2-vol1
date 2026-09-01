'use client';
import { Suspense, useEffect } from 'react';
import { ProductCard } from '@/widgets/product-card';
import { useProductFilters } from '@/features/product-filters/model/useProductFilters';
import { ProductFiltersForm } from '@/features/product-filters/ui/ProductFiltersForm';
import { track } from '@/analytics/logger';

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

  // 목록 화면에 진입한 시점 1회만 기록한다. 필터를 바꿀 때마다 다시 보내지
  // 않는다 — 그건 category_filter_change 등 별개의 이벤트 영역이라
  // 이번 계측 대상(8개 지점)에는 포함하지 않았다.
  useEffect(() => {
    track('product_list_view', {
      category: filters.category,
      sort: filters.sort,
      page: filters.page,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 화면 진입 시점 1회만 기록
  }, []);

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
        {isLoading && (
          <div
            className="week05-grid"
            aria-busy="true"
            aria-label="상품을 불러오는 중"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <article
                key={i}
                className="week05-product"
                style={{ opacity: 0.5 }}
              >
                <div
                  style={{
                    aspectRatio: '1/1',
                    background: '#e5e5e5',
                    borderRadius: 4,
                  }}
                />
                <p
                  style={{
                    background: '#e5e5e5',
                    height: 14,
                    width: '60%',
                    marginTop: 8,
                  }}
                />
                <h3
                  style={{ background: '#e5e5e5', height: 16, width: '90%' }}
                />
              </article>
            ))}
          </div>
        )}

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
