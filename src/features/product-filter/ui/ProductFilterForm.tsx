'use client';

import { useState } from 'react';

import type { ProductSort } from '@/entities/product';

import { CATEGORY_FILTERS, type CategoryFilter, PRODUCT_SORTS } from '../config/filters';
import { useProductFilterState } from '../model/useProductFilterState';

/**
 * 상품 목록 검색 조건 폼.
 *
 * 조건의 원본은 URL 이므로 이 폼은 상태를 소유하지 않고 URL 을 읽고 쓴다.
 * 그래서 결과 영역과 상태를 주고받을 필요 없이 각자 URL 을 보면 된다.
 *
 * searchDraft 만 로컬 상태다. 입력 중인 값은 아직 확정된 조건이 아니라
 * submit 시점에만 URL 에 반영한다.
 */
export function ProductFilterForm() {
  const { state, setSearch, setCategory, setSort, resetFilters } = useProductFilterState();

  const [searchDraft, setSearchDraft] = useState(state.q);

  // 되돌릴 조건이 있는지는 URL 상태와 입력 중인 draft 에서 파생한다. 따로 저장하지 않는다.
  const hasActiveFilter =
    state.q !== '' || state.category !== 'all' || state.sort !== 'latest' || state.page !== 1 || searchDraft !== '';

  // searchDraft 는 마운트 시점에만 state.q 로 초기화되므로 URL 만 비우면 입력값이 남는다.
  // 확정된 조건의 원본은 URL 이고 draft 는 이 폼의 임시값이라, 둘을 함께 비우는 것도 폼의 일이다.
  const handleReset = () => {
    setSearchDraft('');
    resetFilters();
  };

  return (
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
        <button type="button" onClick={handleReset} disabled={!hasActiveFilter}>
          조건 초기화
        </button>
      </form>
    </section>
  );
}
