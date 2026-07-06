import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import type { Category, SortBy } from '../types';

const DEBOUNCE_MS = 500;

function parseFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: (params.get('category') as Category) ?? 'all',
    searchQuery: params.get('q') ?? '',
    page: Number(params.get('page')) || 1,
    sortBy: (params.get('sort') as SortBy) ?? 'latest',
    minPrice: params.get('minPrice')
      ? Number(params.get('minPrice'))
      : ('' as number | ''),
    maxPrice: params.get('maxPrice')
      ? Number(params.get('maxPrice'))
      : ('' as number | ''),
    inStockOnly: params.get('inStock') === 'true',
  };
}

export function useProductFilter() {
  const [filters, setFilters] = useState(parseFiltersFromURL);

  // 브라우저 뒤로/앞으로 시 URL에서 필터 상태 복원
  useEffect(() => {
    const handlePopState = () => setFilters(parseFiltersFromURL());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 입력 중 불필요한 fetch를 막기 위해 debounce 적용
  const debouncedMinPrice = useDebounce(filters.minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, DEBOUNCE_MS);
  const debouncedSearchQuery = useDebounce(filters.searchQuery, DEBOUNCE_MS);

  // 필터 상태가 바뀔 때마다 URL 쿼리 동기화 (브라우저 히스토리)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== 'all') params.set('category', filters.category);
    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
    if (filters.page > 1) params.set('page', String(filters.page));
    if (filters.sortBy !== 'latest') params.set('sort', filters.sortBy);
    if (debouncedMinPrice !== '')
      params.set('minPrice', String(debouncedMinPrice));
    if (debouncedMaxPrice !== '')
      params.set('maxPrice', String(debouncedMaxPrice));
    if (filters.inStockOnly) params.set('inStock', 'true');
    window.history.pushState(null, '', `?${params.toString()}`);
  }, [
    filters.category,
    debouncedSearchQuery,
    filters.page,
    filters.sortBy,
    debouncedMinPrice,
    debouncedMaxPrice,
    filters.inStockOnly,
  ]);

  const handleCategoryChange = (cat: Category) => {
    setFilters((prev) => ({ ...prev, category: cat, page: 1 }));
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFilters((prev) => ({
      ...prev,
      minPrice: v === '' ? '' : Number(v),
      page: 1,
    }));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFilters((prev) => ({
      ...prev,
      maxPrice: v === '' ? '' : Number(v),
      page: 1,
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: e.target.value as SortBy,
      page: 1,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value, page: 1 }));
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, inStockOnly: e.target.checked, page: 1 }));
  };

  const handlePageChange = (next: number) => {
    setFilters((prev) => ({ ...prev, page: next }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'latest',
      searchQuery: '',
      inStockOnly: false,
      page: 1,
    });
  };

  return {
    // 입력창 표시용 raw값
    minPriceInput: filters.minPrice,
    maxPriceInput: filters.maxPrice,
    searchQueryInput: filters.searchQuery,
    // fetch에 쓸 debounced값
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    searchQuery: debouncedSearchQuery,
    category: filters.category,
    sortBy: filters.sortBy,
    page: filters.page,
    inStockOnly: filters.inStockOnly,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handlePageChange,
    handleResetFilters,
  };
}
