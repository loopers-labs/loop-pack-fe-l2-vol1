import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

type Category = 'all' | 'electronics' | 'fashion' | 'home' | 'beauty';
type SortBy = 'latest' | 'popular' | 'price-asc' | 'price-desc';

const DEBOUNCE_MS = 500;

export function useProductFilter() {
  const [category, setCategory] = useState<Category>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  // 입력 중 불필요한 fetch를 막기 위해 debounce 적용
  const debouncedMinPrice = useDebounce(minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebounce(maxPrice, DEBOUNCE_MS);
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_MS);

  // 필터 상태가 바뀔 때마다 URL 쿼리 동기화 (브라우저 히스토리)
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'latest') params.set('sort', sortBy);
    if (debouncedMinPrice !== '')
      params.set('minPrice', String(debouncedMinPrice));
    if (debouncedMaxPrice !== '')
      params.set('maxPrice', String(debouncedMaxPrice));
    if (inStockOnly) params.set('inStock', 'true');
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [
    category,
    debouncedSearchQuery,
    page,
    sortBy,
    debouncedMinPrice,
    debouncedMaxPrice,
    inStockOnly,
  ]);

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
    // 입력창 표시용 raw값
    minPriceInput: minPrice,
    maxPriceInput: maxPrice,
    searchQueryInput: searchQuery,
    // fetch에 쓸 debounced값
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    searchQuery: debouncedSearchQuery,
    category,
    sortBy,
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
