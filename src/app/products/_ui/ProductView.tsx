'use client';

import { useEffect } from 'react';
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

/* AI-generated : Week 7 Part 2 — 갱신 중(isFetching)에 Pagination을 숨기던 걸 없애 CLS를 만들던 마운트/언마운트를 제거하고, ProductListSection에 isUpdating을 넘겨 최소한의 로딩 신호를 준다 */
/* AI-generated : Week 7 Part 2 — 필터 변경으로 새 데이터가 도착하면 겹치는 상품(같은 product.id)이 다른 그리드 슬롯으로 옮겨가며 실제 LayoutShift가 발생함을 실측으로 확인. ProductListSection을 dataUpdatedAt으로 키잉해 데이터가 바뀔 때마다 카드 전체를 새로 마운트시켜, key 기반 재사용(=슬라이드 이동)을 원천 차단한다 */
/* AI-generated : Week 7 Part 2 — 갱신 실패(재시도 소진) 시 QueryState가 무조건 renderError로 전체 교체해 기존 목록이 사라지던 문제. renderInlineError를 넘겨, 직전 성공 데이터가 남아있으면 목록은 그대로 두고 인라인 에러 배너만 추가로 보여준다 */
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
      <PageHeading
        title="상품 목록"
        description="카테고리와 조건으로 원하는 상품을 찾아보세요."
        compact
      />
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
        renderInlineError={(_error, onRetry) => (
          <ErrorRetry
            message="목록을 갱신하지 못했습니다. 이전 목록을 표시하고 있어요."
            onRetry={onRetry}
          />
        )}
      >
        {(data) => (
          <>
            <ProductListSection
              key={productListQuery.dataUpdatedAt}
              products={data.products}
              emptyMessage="검색 결과가 없습니다."
              sectionLabel="상품 검색 결과"
              isUpdating={productListQuery.isFetching}
            >
              <p>총 {data.totalCount}개</p>
            </ProductListSection>
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryState>
    </main>
  );
}
