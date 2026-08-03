import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { productsQueries } from '@/queries/productsQueries';
import { DEBOUNCE_DELAY } from '@/constants/time';

const categoryValues = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const;
const sortValues = ['latest', 'popular', 'price-asc', 'price-desc'] as const;

export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsStringLiteral(categoryValues).withDefault('all'),
      sort: parseAsStringLiteral(sortValues).withDefault('latest'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'push' },
  );

  const [searchInput, setSearchInput] = useState(filters.q);
  const isFirstRender = useRef(true);
  const skipNextDebounce = useRef(false);
  // debounce가 마지막으로 URL에 반영한 값. 이 값이 filters.q로 돌아올 때는 외부 변경이 아니므로 sync 건너뜀
  const lastDebounceQ = useRef(filters.q);

  // 브라우저 앞/뒤로가기로 URL이 바뀌면 searchInput을 URL에 맞게 sync
  useEffect(() => {
    if (filters.q !== searchInput && filters.q !== lastDebounceQ.current) {
      skipNextDebounce.current = true;
      setSearchInput(filters.q);
    }
    // searchInput은 의존성에서 제외 — filters.q가 외부에서 바뀔 때만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (skipNextDebounce.current) {
      skipNextDebounce.current = false;
      return;
    }
    const timer = setTimeout(() => {
      lastDebounceQ.current = searchInput;
      void setFilters({ q: searchInput, page: 1 });
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  const { data, isLoading, isError, refetch } = useQuery(
    productsQueries.productList(filters),
  );

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

  useEffect(() => {
    if (data && filters.page > totalPages) {
      void setFilters({ page: 1 }, { history: 'replace' });
    }
  }, [data, filters.page, totalPages, setFilters]);

  return {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    data,
    isLoading,
    isError,
    refetch,
    totalPages,
  };
}
