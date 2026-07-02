import { useState } from 'react';
import type { Category, SortBy } from '../shared';
import { getUrlSearchParams } from '../utils/urlSearchParams';

export const useProductResult = () => {
  const {
    category: initialCategory,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    sortBy: initialSortBy,
    searchQuery: initialSearchQuery,
    page: initialPage,
    inStockOnly: initialInStockOnly,
  } = getUrlSearchParams();

  // ─── 필터 상태 ──────────────────────────────────────────
  const [category, setCategory] = useState<Category>(initialCategory);
  const [minPrice, setMinPrice] = useState<number | ''>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<number | ''>(initialMaxPrice);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);

  // ─── 검색 상태 ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // ─── 페이지네이션 상태 ──────────────────────────────────
  const [page, setPage] = useState(initialPage);

  // ─── 옵션 토글 ──────────────────────────────────────────
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);

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
    // AI로 as 타입 단언 해결
    const { value } = e.target;
    const SORT_VALUES: Record<string, SortBy> = {
      latest: 'latest',
      popular: 'popular',
      'price-asc': 'price-asc',
      'price-desc': 'price-desc',
    };
    const selectedSortBy = SORT_VALUES[value];
    if (selectedSortBy) {
      setSortBy(selectedSortBy);
    }
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
};
