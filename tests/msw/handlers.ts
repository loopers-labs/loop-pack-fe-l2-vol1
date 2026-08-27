import { http, HttpResponse } from 'msw';

import { CATEGORIES, HOME_RESPONSE, PRODUCTS } from './fixtures';

import {
  PRODUCT_SORTS,
  type Product,
  type ProductListResponse,
  type ProductSort,
} from '@/entities/product';

const DEFAULT_PAGE_SIZE = 12;

const SORT_COMPARATORS: Record<
  ProductSort,
  (a: Product, b: Product) => number
> = {
  latest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  popular: (a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

const isProductSort = (value: string | null): value is ProductSort =>
  PRODUCT_SORTS.some((sort) => sort === value);

const matches = (product: Product, category: string, keyword: string) => {
  const inCategory = category === 'all' || product.category === category;
  const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase('ko');

  return inCategory && searchable.includes(keyword);
};

/** 성공 경로만 만든다. 실패·지연·빈 결과는 그것을 확인하는 테스트가 덮는다. */
export const productListResponse = (
  searchParams: URLSearchParams,
): ProductListResponse => {
  const keyword = searchParams.get('q')?.trim().toLocaleLowerCase('ko') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const sort = searchParams.get('sort');
  const page = Number(searchParams.get('page') ?? 1);
  const pageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);

  const matched = PRODUCTS.filter((product) =>
    matches(product, category, keyword),
  );
  const sorted = isProductSort(sort)
    ? [...matched].sort(SORT_COMPARATORS[sort])
    : matched;
  const start = (page - 1) * pageSize;

  return {
    products: sorted.slice(start, start + pageSize),
    categories: CATEGORIES,
    totalCount: matched.length,
    page,
    pageSize,
  };
};

export const handlers = [
  http.get('*/api/home', () => HttpResponse.json(HOME_RESPONSE)),
  http.get('*/api/products', ({ request }) =>
    HttpResponse.json(productListResponse(new URL(request.url).searchParams)),
  ),
];
