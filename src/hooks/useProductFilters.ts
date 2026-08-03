import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { productsQueries } from '@/queries/productsQueries';
import { DEBOUNCE_DELAY } from '@/shared/constants/time';

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
  // 마지막으로 URL에 반영한 값. debounce가 쓴 것인지 외부(뒤로/앞으로가기)가 바꾼 것인지 구분
  const lastCommitted = useRef(filters.q);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 뒤로/앞으로가기로 URL이 바뀌면 searchInput을 sync. 대기 중인 debounce도 취소
  useEffect(() => {
    if (filters.q !== lastCommitted.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      lastCommitted.current = filters.q;
      setSearchInput(filters.q);
    }
  }, [filters.q]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastCommitted.current = value;
      void setFilters({ q: value, page: 1 });
    }, DEBOUNCE_DELAY);
  };

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
    handleSearchChange,
    data,
    isLoading,
    isError,
    refetch,
    totalPages,
  };
}
