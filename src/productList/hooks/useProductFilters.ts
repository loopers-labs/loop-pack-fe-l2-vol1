import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import { CATEGORY_FILTER_VALUES, SORT_VALUES } from '../types';

// 필터·검색·페이지 상태를 URL 쿼리스트링을 단일 출처(SSOT)로 관리한다.
export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      category: parseAsStringLiteral(CATEGORY_FILTER_VALUES).withDefault('all'),
      minPrice: parseAsInteger,
      maxPrice: parseAsInteger,
      sortBy: parseAsStringLiteral(SORT_VALUES).withDefault('latest'),
      searchQuery: parseAsString.withDefault(''),
      inStockOnly: parseAsBoolean.withDefault(false),
      page: parseAsInteger.withDefault(1),
    },
    { urlKeys: { sortBy: 'sort', searchQuery: 'q', inStockOnly: 'inStock' } },
  );

  // 필터 변경 시, 값 set 후 첫 페이지로
  const setFilter = (patch: Partial<typeof filters>) =>
    void setFilters({ ...patch, page: 1 });

  const setPage = (page: number) => void setFilters({ page });

  const resetFilter = () => void setFilters(null);

  return {
    ...filters,
    setFilter,
    setPage,
    resetFilter,
  };
}
