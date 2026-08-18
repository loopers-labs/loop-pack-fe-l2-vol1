import type {
  Product,
  ProductListQuery,
  ProductListResponse,
} from '@/entities/product/model/types';
import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';

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

export function buildProductDetailUrl(id: string): string {
  const searchParams = new URLSearchParams({ id });

  return `${getApiBase()}/api/products?${searchParams.toString()}`;
}

export async function fetchProductList(
  params: ProductListQuery,
  options?: { signal?: AbortSignal },
): Promise<ProductListResponse> {
  const isServer = typeof window === 'undefined';
  const res = isServer
    ? await fetch(buildProductListUrl(params))
    : await fetch(buildProductListUrl(params), { signal: options?.signal });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        '상품 목록을 불러오지 못했습니다.',
    );
  }

  return res.json() as Promise<ProductListResponse>;
}

export async function fetchProductById(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<Product> {
  const isServer = typeof window === 'undefined';
  const response = isServer
    ? await fetch(buildProductDetailUrl(id))
    : await fetch(buildProductDetailUrl(id), { signal: options?.signal });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        '상품 정보를 불러오지 못했습니다.',
    );
  }

  return response.json() as Promise<Product>;
}
