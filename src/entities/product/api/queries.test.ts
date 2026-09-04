import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { productQueries } from './queries';
import type { ProductListQuery, ProductListResponse } from './types';

import { PRODUCT, PRODUCTS } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';

const CONDITIONS = {
  q: '의자',
  category: 'home',
  sort: 'popular',
  page: 1,
  pageSize: 12,
  scenario: null,
} satisfies Required<ProductListQuery>;

const PREVIOUS_DATA = {
  products: [],
  categories: [],
  totalCount: 30,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse;

const CATALOG_PRODUCTS = Array.from({ length: 49 }, (_, index) => ({
  ...PRODUCT,
  id: `catalog-${index + 1}`,
}));

const keepPreviousList = (
  changed: Partial<Required<ProductListQuery>>,
  previousData: ProductListResponse | undefined,
) => {
  const { placeholderData } = productQueries.list({
    ...CONDITIONS,
    ...changed,
  });

  if (typeof placeholderData !== 'function') {
    throw new Error('목록 쿼리에 placeholderData 함수가 연결돼 있지 않다.');
  }

  return placeholderData(previousData, undefined);
};

describe('상품 쿼리 키', () => {
  it('목록 키에는 조회 조건이 그대로 실린다', () => {
    expect(productQueries.list(CONDITIONS).queryKey).toEqual([
      'products',
      'list',
      CONDITIONS,
    ]);
  });

  it('모든 키가 루트 키로 시작해 한 번에 무효화할 수 있다', () => {
    const all = productQueries.all();

    for (const { queryKey } of [
      productQueries.home(),
      productQueries.list(CONDITIONS),
      productQueries.catalog(),
    ]) {
      expect(queryKey.slice(0, all.length)).toEqual(all);
    }
  });
});

describe('목록 쿼리의 placeholderData', () => {
  // 어느 조건이 바뀌든 같은 함수를 지나므로 한 케이스면 된다.
  // 화면에 이전 목록이 실제로 남는지는 ProductList.conditions.dom.test.ts가 본다.
  it('조건이 달라져도 새 목록이 올 때까지 이전 목록을 보여준다', () => {
    expect(keepPreviousList({ category: 'digital' }, PREVIOUS_DATA)).toBe(
      PREVIOUS_DATA,
    );
  });

  it('이전 목록이 없으면 보여줄 것도 없다', () => {
    expect(keepPreviousList({}, undefined)).toBeUndefined();
  });
});

describe('catalog 쿼리', () => {
  // node 환경의 apiClient는 APP_ORIGIN으로 절대 URL을 만든다
  beforeEach(() => {
    vi.stubEnv('APP_ORIGIN', 'https://commerce.example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const fetchCatalog = () =>
    new QueryClient().fetchQuery(productQueries.catalog());

  it('totalCount에 필요한 모든 페이지를 조회해 페이지 순서대로 합친다', async () => {
    const requestedPages: string[] = [];

    server.use(
      http.get('*/api/products', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = Number(params.get('page'));
        const pageSize = Number(params.get('pageSize'));
        const start = (page - 1) * pageSize;

        requestedPages.push(`${page}:${pageSize}`);

        return HttpResponse.json<ProductListResponse>({
          products: CATALOG_PRODUCTS.slice(start, start + pageSize),
          categories: [],
          totalCount: CATALOG_PRODUCTS.length,
          page,
          pageSize,
        });
      }),
    );

    const catalog = await fetchCatalog();

    expect([...requestedPages].sort()).toEqual(['1:24', '2:24', '3:24']);
    expect(catalog.map((product) => product.id)).toEqual(
      CATALOG_PRODUCTS.map((product) => product.id),
    );
  });

  it('totalCount가 한 페이지 안이면 추가 조회하지 않는다', async () => {
    const productsRequest = vi.fn();
    const firstThree = PRODUCTS.slice(0, 3);

    server.use(
      http.get('*/api/products', () => {
        productsRequest();

        return HttpResponse.json<ProductListResponse>({
          products: firstThree,
          categories: [],
          totalCount: firstThree.length,
          page: 1,
          pageSize: 24,
        });
      }),
    );

    const catalog = await fetchCatalog();

    expect(productsRequest).toHaveBeenCalledTimes(1);
    expect(catalog).toEqual(firstThree);
  });
});
