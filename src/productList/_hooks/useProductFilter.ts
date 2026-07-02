import { useState, useEffect } from 'react';

type Category = 'all' | 'electronics' | 'fashion' | 'home' | 'beauty';
type SortBy = 'latest' | 'popular' | 'price-asc' | 'price-desc';

export function useProductFilter() {
  const [category, setCategory] = useState<Category>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  // 필터·검색·페이지 상태가 바뀔 때마다 URL 쿼리 동기화 (브라우저 히스토리)
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

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setPage(1);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMinPrice(v === '' ? '' : Number(v));
    setPage(1);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setMaxPrice(v === '' ? '' : Number(v));
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(e.target.checked);
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
  };

  const handleResetFilters = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
    setSearchQuery('');
    setInStockOnly(false);
    setPage(1);
  };

  return {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    page,
    inStockOnly,
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
