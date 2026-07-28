import { useProductListFilters } from '@/features/product/hooks/useProductListFilters';
import { useState, useEffect } from 'react';

const DEBOUNCE_MS = 300;

export const useProductPage = () => {
  const { q, category, sort, page, setQ, setCategory, setSort, setPage, query } =
    useProductListFilters();
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) setQ(searchInput);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, setQ, searchInput]);

  return {
    q,
    category,
    sort,
    page,
    searchInput,
    setQ,
    setCategory,
    setSort,
    setPage,
    setSearchInput,
    query,
  };
};
