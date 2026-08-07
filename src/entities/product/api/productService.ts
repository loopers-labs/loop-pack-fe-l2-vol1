import type {
  Product,
  ProductListQuery,
  ProductListResponse,
} from '@/entities/product/model/types';
import { categories, products } from './commerce';

export const PRODUCT_LIST_DEFAULTS = {
  sort: 'latest',
  page: 1,
  pageSize: 12,
} as const;

export function getProductList(
  params: ProductListQuery,
): ProductListResponse {
  const {
    q,
    category,
    sort = PRODUCT_LIST_DEFAULTS.sort,
    page = PRODUCT_LIST_DEFAULTS.page,
    pageSize = PRODUCT_LIST_DEFAULTS.pageSize,
  } = params;
  const keyword = q?.trim().toLocaleLowerCase('ko') ?? '';

  const filtered = products.filter((product) => {
    const matchesCategory =
      !category || category === 'all' || product.category === category;
    const searchable =
      `${product.brand} ${product.name}`.toLocaleLowerCase('ko');
    return matchesCategory && searchable.includes(keyword);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'popular':
        return b.reviewCount - a.reviewCount || b.rating - a.rating;
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'latest':
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
  });

  const start = (page - 1) * pageSize;

  return {
    products: sorted.slice(start, start + pageSize),
    categories,
    totalCount: filtered.length,
    page,
    pageSize,
  };
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

function getApiBase(): string {
  return typeof window === 'undefined' ? (process.env.APP_ORIGIN ?? '') : '';
}

export function buildProductListUrl(params: ProductListQuery): string {
  const {
    q,
    category,
    sort = PRODUCT_LIST_DEFAULTS.sort,
    page = PRODUCT_LIST_DEFAULTS.page,
    pageSize = PRODUCT_LIST_DEFAULTS.pageSize,
    scenario,
  } = params;

  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  if (category && category !== 'all') sp.set('category', category);
  sp.set('sort', sort);
  sp.set('page', String(page));
  sp.set('pageSize', String(pageSize));
  if (scenario) sp.set('scenario', scenario);

  return `${getApiBase()}/api/products?${sp.toString()}`;
}

export async function fetchProductList(
  params: ProductListQuery,
  options?: { signal?: AbortSignal },
): Promise<ProductListResponse> {
  const res = await fetch(buildProductListUrl(params), {
    signal: options?.signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        '상품 목록을 불러오지 못했습니다.',
    );
  }

  return res.json() as Promise<ProductListResponse>;
}
