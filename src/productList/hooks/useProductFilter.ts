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
const SEARCH_DEBOUNCE_MS = 300;

function getInitialParams() {
  return new URLSearchParams(window.location.search);
}

// 화이트리스트(validValues) 안에 있는 값만 통과시키고, 아니면 fallback 반환
function pickFromList<T extends string>(
  value: string | null,
  validValues: readonly T[],
  fallback: T,
): T {
  return value !== null && (validValues as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

// 문자열을 숫자로 안전하게 변환, 실패하면 fallback 반환
function pickNumber(value: string | null, fallback: number | ''): number | '' {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function useProductFilter() {
  const [category, setCategory] = useState<'all' | Product['category']>(() =>
    pickFromList(
      getInitialParams().get('category'),
      CATEGORIES.map((c) => c.value),
      'all',
    ),
  );

  const [minPrice, setMinPrice] = useState<number | ''>(() =>
    pickNumber(getInitialParams().get('minPrice'), ''),
  );

  const [maxPrice, setMaxPrice] = useState<number | ''>(() =>
    pickNumber(getInitialParams().get('maxPrice'), ''),
  );

  const [sortBy, setSortBy] = useState<SortBy>(() =>
    pickFromList(
      getInitialParams().get('sort'),
      SORT_OPTIONS.map((o) => o.value),
      'latest',
    ),
  );

  const [searchInput, setSearchInput] = useState(
    () => getInitialParams().get('q') ?? '',
  );
  const [searchQuery, setSearchQuery] = useState(
    () => getInitialParams().get('q') ?? '',
  );

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [page, setPage] = useState(() => {
    const parsed = pickNumber(getInitialParams().get('page'), 1);
    return parsed === '' || parsed < 1 ? 1 : parsed;
  });

  const [inStockOnly, setInStockOnly] = useState(
    () => getInitialParams().get('inStock') === 'true',
  );

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
    searchInput,
    setSearchInput,
    searchQuery,
    page,
    setPage,
    inStockOnly,
    setInStockOnly,
  };
}
