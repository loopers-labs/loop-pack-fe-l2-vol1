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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void setFilters({ q: searchInput, page: 1 });
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  const { data, isLoading, isError, refetch } = useQuery(
    productsQueries.productList(filters),
  );

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

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
