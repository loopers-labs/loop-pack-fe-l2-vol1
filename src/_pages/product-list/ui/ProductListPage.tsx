'use client';

import { ProductFilterForm, useProductFilterState } from '@/features/product-filter';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';

import { toProductListQuery } from '../model/toProductListQuery';
import { PRODUCT_LIST_SCENARIOS } from '../model/types';
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
 *
 * scenario 를 features/product-filter 의 파서에 넣지 않고 여기서 직접 읽는 이유:
 * 그 슬라이스는 "사용자가 무엇을 골랐는가"까지만 안다. scenario 는 사용자의 선택이 아니라
 * 서버 응답을 바꾸는 조회 조건이므로, pageSize 와 같은 자리에서 붙이는 것이 맞다.
 */
export function ProductListPage() {
  const { state, setPage } = useProductFilterState();
  const [scenario] = useQueryState('scenario', parseAsStringLiteral(PRODUCT_LIST_SCENARIOS));

  const query = toProductListQuery(state, scenario ?? undefined);

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
