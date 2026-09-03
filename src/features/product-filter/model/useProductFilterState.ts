'use client';

import type { ProductSort } from '@/entities/product';
import { trackCategoryFilterChange, trackPageChange, trackSortChange } from '@/shared/lib/analytics/events';
import { createParser, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import { CATEGORY_FILTER_VALUES, type CategoryFilter, PRODUCT_SORT_VALUES } from '../config/filters';
import { isReachablePage } from './parseFilterParams';

/**
 * 페이지 번호. 조회할 수 없는 값은 첫 페이지로 떨어뜨린다.
 *
 * `parseAsInteger.withDefault(1)` 만 쓰면 안 된다 — `withDefault` 는 파라미터가 **없을 때만**
 * 적용되고, `?page=0` 은 정수로 잘 파싱되어 0 그대로 통과한다.
 * 서버는 `parseFilterParams` 로 같은 URL 을 1 로 읽으므로 두 경로가 갈렸고,
 * 그 결과 1페이지 상품을 보면서 "0 / 3" 이라고 적힌 화면이 나왔다.
 * `parse` 가 null 을 돌려주면 nuqs 가 기본값으로 떨어뜨린다.
 */
const parseAsReachablePage = createParser({
  parse: (value) => {
    const page = parseAsInteger.parse(value);

    return page !== null && isReachablePage(page) ? page : null;
  },
  serialize: (page: number) => String(page),
});

/**
 * 사용자가 고른 필터 조건의 URL 상태를 읽고 쓴다.
 *
 * 조건의 원본은 URL 이다(nuqs). 공유, 새로고침, 앞뒤 이동에서 복원되어야 하기 때문.
 * 기본 정렬도 'latest'로 두고, API 요청에 sort=latest 를 명시한다(sort 생략은 4주차 호환용)
 * 필터 값 목록은 같은 슬라이스 config의 SSOT를 사용한다
 * 페이지 하한 판정은 서버와 어긋나지 않도록 parseFilterParams 의 것을 그대로 쓴다.
 * scenario 는 사용자가 고르는 필터가 아니므로 여기서 다루지 않는다.
 * URL 에는 실리지만, 읽어서 조회 조건에 붙이는 것은 조회하는 쪽(_pages/product-list)의 일이다.
 * resetFilters 가 scenario 를 지우지 않는 것도 같은 이유다 — 이 훅의 소유가 아니다.
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
  page: parseAsReachablePage.withDefault(1),
};

export const useProductFilterState = () => {
  const [state, setState] = useQueryStates(defaultParsers, { history: 'push' });

  // 조건을 바꾸는 조작만 계측한다. 검색어는 시드 로그에 대응하는 이름이 없어 붙이지 않는다.
  // 조건 변경은 페이지를 1 로 되돌리지만 그 되돌림을 page_change 로 세지 않는다 —
  // 사용자가 페이지를 옮긴 것이 아니라 조건 변경의 부수 효과다.
  const setSearch = (q: string) => setState({ q, page: 1 });

  const setCategory = (category: CategoryFilter) => {
    trackCategoryFilterChange(category);

    return setState({ category, page: 1 });
  };

  const setSort = (sort: ProductSort) => {
    trackSortChange(sort);

    return setState({ sort, page: 1 });
  };

  const setPage = (page: number) => {
    trackPageChange(page);

    return setState({ page });
  };

  /**
   * 모든 조건을 기본값으로 되돌린다.
   * null 을 넘기면 nuqs 가 해당 파라미터를 URL 에서 제거하고 파서의 기본값으로 읽는다.
   * 개별 setter 처럼 기본값을 여기 하드코딩하면 defaultParsers 와 두 벌이 된다.
   */
  const resetFilters = () => setState({ q: null, category: null, sort: null, page: null });

  return { state, setSearch, setCategory, setSort, setPage, resetFilters };
};
