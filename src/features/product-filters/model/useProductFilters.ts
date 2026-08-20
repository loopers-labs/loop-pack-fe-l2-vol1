import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { productsQueries } from '@/entities/product/api/productsQueries';
import { getProducts } from '@/entities/product/api/products';
import { DEBOUNCE_DELAY } from '@/shared/constants/time';
import type { MockApiScenario } from '@/shared/api';

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

  const [scenario] = useQueryState('scenario');

  const [searchInput, setSearchInput] = useState(filters.q);
  const lastCommitted = useRef(filters.q);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...productsQueries.productList(filters),
    queryFn: () =>
      getProducts({ ...filters, scenario: scenario as MockApiScenario | null }),
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / data.pageSize))
    : 1;

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
    isFetching,
    isError,
    refetch,
    totalPages,
  };
}
