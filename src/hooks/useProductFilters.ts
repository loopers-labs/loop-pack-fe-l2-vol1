import { useEffect, useState } from 'react';
import type { Product, SortBy } from '../types/product';
import type { ProductListParams } from '../services/productApi';
import { useDebouncedValue } from './useDebouncedValue';

type Category = 'all' | Product['category'];

const CATEGORY_VALUES: Category[] = [
  'all',
  'electronics',
  'fashion',
  'home',
  'beauty',
];
const SORT_VALUES: SortBy[] = ['latest', 'popular', 'price-asc', 'price-desc'];

// 검색어·가격이 서버 파라미터로 반영되기까지의 디바운스 지연(ms)
const DEBOUNCE_MS = 300;

const DEFAULT_VALUES: ProductListParams = {
  category: 'all',
  minPrice: '',
  maxPrice: '',
  sortBy: 'latest',
  searchQuery: '',
  inStockOnly: false,
  page: 1,
};

// ── URL 쿼리 → 필터 초기값 파싱 (타입 침묵 없이 값으로 좁힌다) ──────────
function parseCategory(raw: string | null): Category {
  return CATEGORY_VALUES.find((c) => c === raw) ?? 'all';
}

function parseSort(raw: string | null): SortBy {
  return SORT_VALUES.find((s) => s === raw) ?? 'latest';
}

function parsePrice(raw: string | null): number | '' {
  if (raw === null || raw === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : '';
}

function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function readInitialValues(): ProductListParams {
  const p = new URLSearchParams(window.location.search);
  return {
    category: parseCategory(p.get('category')),
    minPrice: parsePrice(p.get('minPrice')),
    maxPrice: parsePrice(p.get('maxPrice')),
    sortBy: parseSort(p.get('sort')),
    searchQuery: p.get('q') ?? '',
    inStockOnly: p.get('inStock') === 'true',
    page: parsePage(p.get('page')),
  };
}

export type ProductFilters = {
  /** 입력창에 바로 반영되는 현재 값 (즉시) */
  values: ProductListParams;
  /** useProducts에 넘길 서버 요청 파라미터 (검색어·가격은 디바운스된 값) */
  params: ProductListParams;
  setCategory: (category: Category) => void;
  setMinPrice: (minPrice: number | '') => void;
  setMaxPrice: (maxPrice: number | '') => void;
  setSortBy: (sortBy: SortBy) => void;
  setSearchQuery: (searchQuery: string) => void;
  setInStockOnly: (inStockOnly: boolean) => void;
  setPage: (page: number) => void;
  reset: () => void;
};

/**
 * 필터·검색·정렬·페이지 상태를 소유하고 URL 쿼리와 동기화하는 훅.
 * - 초기값을 현재 URL에서 복원한다(새로고침·북마크·공유 시 조건 유지).
 * - 필터가 바뀌면 페이지를 1로 되돌린다(필터의 업무 규칙).
 * - `values`는 입력 반응성을 위한 즉시값, `params`는 검색어·가격을 디바운스한
 *   서버 요청용 값 — 타이핑마다 요청이 나가지 않도록 분리한다.
 */
export function useProductFilters(): ProductFilters {
  const [values, setValues] = useState<ProductListParams>(readInitialValues);

  const setCategory = (category: Category) =>
    setValues((v) => ({ ...v, category, page: 1 }));
  const setMinPrice = (minPrice: number | '') =>
    setValues((v) => ({ ...v, minPrice, page: 1 }));
  const setMaxPrice = (maxPrice: number | '') =>
    setValues((v) => ({ ...v, maxPrice, page: 1 }));
  const setSortBy = (sortBy: SortBy) =>
    setValues((v) => ({ ...v, sortBy, page: 1 }));
  const setSearchQuery = (searchQuery: string) =>
    setValues((v) => ({ ...v, searchQuery, page: 1 }));
  const setInStockOnly = (inStockOnly: boolean) =>
    setValues((v) => ({ ...v, inStockOnly, page: 1 }));
  const setPage = (page: number) => setValues((v) => ({ ...v, page }));
  const reset = () => setValues(DEFAULT_VALUES);

  // 서버로 넘어가는 검색어·가격만 디바운스 (카테고리·정렬·페이지는 즉시)
  const debouncedSearch = useDebouncedValue(values.searchQuery, DEBOUNCE_MS);
  const debouncedMinPrice = useDebouncedValue(values.minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebouncedValue(values.maxPrice, DEBOUNCE_MS);

  const params: ProductListParams = {
    category: values.category,
    sortBy: values.sortBy,
    inStockOnly: values.inStockOnly,
    page: values.page,
    searchQuery: debouncedSearch,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
  };

  // URL은 "실제로 요청·표시되는" 값(디바운스된 파라미터)과 일치시킨다
  useEffect(() => {
    const p = new URLSearchParams();
    if (params.category !== 'all') p.set('category', params.category);
    if (params.searchQuery) p.set('q', params.searchQuery);
    if (params.page > 1) p.set('page', String(params.page));
    if (params.sortBy !== 'latest') p.set('sort', params.sortBy);
    if (params.minPrice !== '') p.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== '') p.set('maxPrice', String(params.maxPrice));
    if (params.inStockOnly) p.set('inStock', 'true');
    const qs = p.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `?${qs}` : window.location.pathname,
    );
  }, [
    params.category,
    params.searchQuery,
    params.page,
    params.sortBy,
    params.minPrice,
    params.maxPrice,
    params.inStockOnly,
  ]);

  return {
    values,
    params,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSearchQuery,
    setInStockOnly,
    setPage,
    reset,
  };
}
