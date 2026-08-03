'use client';

import { DEFAULT_PAGE_SIZE, ProductFilterForm, useProductFilterState } from '@/features/product-filter';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import type { ProductListQuery } from '../model/types';
import { ProductListResult } from './ProductListResult';

/**
 * 상품 목록 화면 조합. 필터 feature 와 결과 영역을 붙인다.
 *
 * 필터 폼은 ErrorBoundary 경계 밖에 둔다.
 * 조건을 바꾸면 결과 영역만 갈아 끼우고, 필터 폼은 항상 화면에 남는다.
 *
 * 폼과 여기서 useProductFilterState 를 각각 부르지만 상태가 갈라지지 않는다.
 * 원본이 URL 이라 둘 다 같은 곳을 읽는다.
 *
 * 필터가 고른 값을 조회 조건으로 조립하는 것은 조회하는 쪽인 이 슬라이스의 일이다.
 * pageSize 처럼 사용자가 고르지 않는 값이 여기서 붙는다.
 */
export function ProductListPage() {
  const { state, setPage } = useProductFilterState();

  const query: ProductListQuery = {
    q: state.q,
    category: state.category,
    sort: state.sort,
    page: state.page,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  return (
    <>
      <ProductFilterForm />

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ resetErrorBoundary }) => (
              <section className="week05-section" role="alert">
                <p>상품 목록을 불러오지 못했습니다.</p>
                <button type="button" onClick={resetErrorBoundary}>
                  다시 시도
                </button>
              </section>
            )}
          >
            <ProductListResult query={query} page={state.page} onPageChange={setPage} />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </>
  );
}
