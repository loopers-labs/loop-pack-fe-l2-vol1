import type { Category, ProductParams, SortBy } from '../shared';

// AI: 타입 가드 작성
const CATEGORIES: ReadonlyArray<Category> = ['all', 'electronics', 'fashion', 'home', 'beauty'];
const SORT_OPTIONS: ReadonlyArray<SortBy> = ['latest', 'popular', 'price-asc', 'price-desc'];

const isCategory = (value: string | null): value is Category =>
  value !== null && CATEGORIES.some((c) => c === value);

const isSortBy = (value: string | null): value is SortBy =>
  value !== null && SORT_OPTIONS.some((s) => s === value);

const parsePrice = (value: string | null): number | '' => {
  if (value === null || value === '') return '';
  const n = Number(value);
  return Number.isNaN(n) ? '' : n;
};

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const n = value === null ? NaN : Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
};

export const getUrlSearchParams = (params: URLSearchParams): ProductParams => {
  const categoryParam = params.get('category');
  const sortParam = params.get('sort');

  return {
    category: isCategory(categoryParam) ? categoryParam : 'all',
    searchQuery: params.get('q') ?? '',
    page: parsePositiveInt(params.get('page'), 1),
    sortBy: isSortBy(sortParam) ? sortParam : 'latest',
    minPrice: parsePrice(params.get('minPrice')),
    maxPrice: parsePrice(params.get('maxPrice')),
    inStockOnly: params.get('inStock') === 'true',
    itemsPerPage: parsePositiveInt(params.get('size'), 12),
  };
};

export const setUrlSearchParams = ({
  category,
  sortBy,
  searchQuery,
  page,
  itemsPerPage,
  minPrice,
  maxPrice,
  inStockOnly,
}: ProductParams): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('category', category);
  if (searchQuery) params.set('q', searchQuery);
  if (page > 1) params.set('page', String(page));
  if (sortBy !== 'latest') params.set('sort', sortBy);
  if (minPrice !== '') params.set('minPrice', String(minPrice));
  if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
  if (inStockOnly) params.set('inStock', 'true');
  params.set('size', String(itemsPerPage));

  return params;
};
