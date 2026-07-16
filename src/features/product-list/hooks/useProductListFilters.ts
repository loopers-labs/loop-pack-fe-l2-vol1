'use client';

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import type { CategoryId, ProductSort } from '@/types/commerce';

// nuqs parser용 리터럴. 과제 계약에 따라 category/sort 후보값을 고정한다. (AI 활용)
export const CATEGORIES = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies (CategoryId | 'all')[];
export const SORTS = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[];

export type CategoryValue = (typeof CATEGORIES)[number];
export type SortValue = (typeof SORTS)[number];

// pageSize는 URL 상태가 아닌 고정값 (과제 범위). scenario는 URL/쿼리에 넣지 않는다.
export const PAGE_SIZE = 12;

// [AI] q/category/sort/page를 URL 상태로 관리.
// history: 'push' — 각 변경을 히스토리에 push해 앞뒤 이동으로 복원.
const parsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORIES).withDefault('all'),
  sort: parseAsStringLiteral(SORTS).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

// select 등 DOM에서 온 문자열을 리터럴 타입으로 좁히는 가드 (as 단언 없이).
export const isCategoryValue = (value: string): value is CategoryValue =>
  CATEGORIES.some((candidate) => candidate === value);

export const isSortValue = (value: string): value is SortValue =>
  SORTS.some((candidate) => candidate === value);

export const useProductListFilters = () => {
  const [filters, setFilters] = useQueryStates(parsers, { history: 'push' });

  // 검색·카테고리·정렬이 바뀌면 page를 1로 되돌린다.
  const setQ = (q: string) => setFilters({ q, page: 1 });
  const setCategory = (category: CategoryValue) => setFilters({ category, page: 1 });
  const setSort = (sort: SortValue) => setFilters({ sort, page: 1 });
  const setPage = (page: number) => setFilters({ page });

  // 쿼리 팩토리에 넘길 ProductListQuery. 기본 정렬 latest를 항상 명시하고 pageSize는 고정.
  const query = {
    q: filters.q,
    category: filters.category,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };

  return {
    q: filters.q,
    category: filters.category,
    sort: filters.sort,
    page: filters.page,
    setQ,
    setCategory,
    setSort,
    setPage,
    query,
  };
};
