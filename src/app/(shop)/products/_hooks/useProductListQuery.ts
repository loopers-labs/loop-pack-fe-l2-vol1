'use client';

import type { ProductListQuery, ProductSort } from '@/types/commerce';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import { CATEGORY_FILTER_VALUES, type CategoryFilter, DEFAULT_PAGE_SIZE, PRODUCT_SORT_VALUES } from '../_constants';

/**
 * 검색 조건의 원본은 URL 이다(nuqs). 공유, 새로고침, 앞뒤 이동에서 복원되어야 하기 때문.
 * 기본 정렬도 'latest'로 두고, API 요청에 sort=latest 를 명시한다(sort 생략은 4주차 호환용)
 * 필터 값 목록은 피처 로컬 _constants의 SSOT를 사용한다
 * scenario 는 검증 전용 제어값이라 URL 상태, ProductListQuery 에 포함하지 않는다.
 */
const defaultParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORY_FILTER_VALUES).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORT_VALUES).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

export const useProductListQuery = () => {
  const [state, setState] = useQueryStates(defaultParsers, { history: 'push' });

  const setSearch = (q: string) => setState({ q, page: 1 });
  const setCategory = (category: CategoryFilter) => setState({ category, page: 1 });
  const setSort = (sort: ProductSort) => setState({ sort, page: 1 });
  const setPage = (page: number) => setState({ page });

  const query: ProductListQuery = {
    q: state.q,
    category: state.category,
    sort: state.sort,
    page: state.page,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  return { state, query, setSearch, setCategory, setSort, setPage };
};
