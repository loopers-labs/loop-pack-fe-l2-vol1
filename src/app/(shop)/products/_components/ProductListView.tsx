'use client';

import { useState } from 'react';

import type { ProductSort } from '@/types/commerce';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { CATEGORY_FILTERS, type CategoryFilter, PRODUCT_SORTS } from '../_constants';
import { useProductListQuery } from '../_hooks/useProductListQuery';
import { ProductList } from './ProductList';

/**
 * 필터 폼(URL 상태 기반)은 Suspense 경계 밖에 둔다.
 * 조건을 바꾸면 결과 영역만 suspend하고, 필터 폼은 항상 화면에 남는다.
 */
export function ProductListView() {
  const { state, query, setSearch, setCategory, setSort, setPage } = useProductListQuery();

  const [searchDraft, setSearchDraft] = useState(state.q);

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form
          className="week05-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchDraft.trim());
          }}
        >
          <label>
            검색
            <input
              name="q"
              placeholder="상품명 또는 브랜드"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>
          <label>
            카테고리
            <select
              name="category"
              value={state.category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
            >
              {CATEGORY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select name="sort" value={state.sort} onChange={(event) => setSort(event.target.value as ProductSort)}>
              {PRODUCT_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">검색</button>
        </form>
      </section>

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
            <ProductList query={query} page={state.page} onPageChange={setPage} />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </>
  );
}
