'use client';

import type { ProductSort } from '@/entities/product';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import { CATEGORY_FILTER_VALUES, type CategoryFilter, PRODUCT_SORT_VALUES } from '../config/filters';

/**
 * 사용자가 고른 필터 조건의 URL 상태를 읽고 쓴다.
 *
 * 조건의 원본은 URL 이다(nuqs). 공유, 새로고침, 앞뒤 이동에서 복원되어야 하기 때문.
 * 기본 정렬도 'latest'로 두고, API 요청에 sort=latest 를 명시한다(sort 생략은 4주차 호환용)
 * 필터 값 목록은 같은 슬라이스 config의 SSOT를 사용한다
 * scenario 는 검증 전용 제어값이라 URL 상태에 포함하지 않는다.
 *
 * 조회 조건(ProductListQuery)으로 조립하는 것은 이 훅의 일이 아니다.
 * 필터는 "사용자가 무엇을 골랐는가"까지만 알고, 그것으로 어떻게 조회할지는
 * 조회하는 쪽(_pages/product-list)이 정한다. pageSize 처럼 사용자가 고르지 않는
 * 값이 조회 조건에 섞이는 것도 같은 이유다.
 */
const defaultParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORY_FILTER_VALUES).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORT_VALUES).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

export const useProductFilterState = () => {
  const [state, setState] = useQueryStates(defaultParsers, { history: 'push' });

  const setSearch = (q: string) => setState({ q, page: 1 });
  const setCategory = (category: CategoryFilter) => setState({ category, page: 1 });
  const setSort = (sort: ProductSort) => setState({ sort, page: 1 });
  const setPage = (page: number) => setState({ page });

  /**
   * 모든 조건을 기본값으로 되돌린다.
   * null 을 넘기면 nuqs 가 해당 파라미터를 URL 에서 제거하고 파서의 기본값으로 읽는다.
   * 개별 setter 처럼 기본값을 여기 하드코딩하면 defaultParsers 와 두 벌이 된다.
   */
  const resetFilters = () => setState({ q: null, category: null, sort: null, page: null });

  return { state, setSearch, setCategory, setSort, setPage, resetFilters };
};
