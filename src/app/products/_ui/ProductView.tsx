'use client';

import { useEffect } from 'react';
import '../../layout.css';
import { Header } from '@/widgets/header/ui/Header';
import { ProductListSection } from '@/widgets/product-list-section/ui/ProductListSection';
import { PageHeading } from '@/shared/ui/PageHeading/PageHeading';
import { ProductFilters } from '@/features/product-filter/ui/ProductFilters';
import { useProductListParams } from '@/features/product-filter/model/useProductListParams';
import { Pagination } from '@/shared/ui/Pagination/Pagination';
import { QueryState } from '@/shared/ui/QueryState';
import { ErrorRetry } from '@/shared/ui/ErrorRetry/ErrorRetry';
import { useProductList } from '@/entities/product/api/useProductList';

const INITIAL_PAGE = 1;

export default function ProductView() {
  const { q, category, sort, page, setQuery, setCategory, setSort, setPage, resetQuery } =
    useProductListParams();
  const productListQuery = useProductList({ q, category, sort, page });

  useEffect(() => {
    const data = productListQuery.data;
    if (!data || data.totalCount === 0) return;

    const totalPages = Math.ceil(data.totalCount / data.pageSize);
    if (page > totalPages) {
      setPage(INITIAL_PAGE);
    }
  }, [productListQuery.data, page, setPage]);

  return (
    <main className="week05-page">
      <Header />
      <PageHeading title="상품 목록" />
      <section className="week05-section">
        <ProductFilters
          filters={{ q, category, sort }}
          onSearch={setQuery}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onReset={resetQuery}
        />
      </section>
      <QueryState
        query={productListQuery}
        renderError={(error) => (
          <ErrorRetry message={error.message} onRetry={() => productListQuery.refetch()} />
        )}
      >
        {(data) => (
          <>
            <ProductListSection
              products={data.products}
              emptyMessage="검색 결과가 없습니다."
              sectionLabel="상품 검색 결과"
            >
              <p>총 {data.totalCount}개</p>
            </ProductListSection>
            {!productListQuery.isFetching && (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                totalCount={data.totalCount}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </QueryState>
    </main>
  );
}
