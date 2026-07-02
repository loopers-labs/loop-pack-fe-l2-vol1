import { useState, useEffect } from 'react';
import type { Product, SortBy } from '../type';

export const CATEGORIES: {
  value: 'all' | Product['category'];
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'electronics', label: '전자제품' },
  { value: 'fashion', label: '패션' },
  { value: 'home', label: '홈' },
  { value: 'beauty', label: '뷰티' },
];

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
];

export const PAGE_SIZE = 12;
export const PAGE_WINDOW = 2;

export function useProductFilter() {
  const [category, setCategory] = useState<'all' | Product['category']>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (searchQuery) params.set('q', searchQuery);
    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'latest') params.set('sort', sortBy);
    if (minPrice !== '') params.set('minPrice', String(minPrice));
    if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
    if (inStockOnly) params.set('inStock', 'true');
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly]);

  return {
    category,
    setCategory,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    inStockOnly,
    setInStockOnly,
  };
}
