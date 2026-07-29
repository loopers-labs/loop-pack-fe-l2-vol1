'use client';

import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
} from 'nuqs';

const CATEGORIES = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const;
const SORTS = ['latest', 'popular', 'price-asc', 'price-desc'] as const;

export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsStringLiteral(CATEGORIES).withDefault('all'),
      sort: parseAsStringLiteral(SORTS).withDefault('latest'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'push' },
  );

  return {
    filters,
    // 검색·카테고리·정렬이 바뀌면 page를 1로 (다른 결과는 1페이지부터)
    setSearch: (q: string) => void setFilters({ q, page: 1 }),
    setCategory: (value: string) =>
      void setFilters({
        category: CATEGORIES.find((c) => c === value) ?? 'all',
        page: 1,
      }),
    setSort: (value: string) =>
      void setFilters({
        sort: SORTS.find((s) => s === value) ?? 'latest',
        page: 1,
      }),
    // 페이지 이동은 다른 조건 유지, page만
    setPage: (page: number) => void setFilters({ page }),
  };
}
