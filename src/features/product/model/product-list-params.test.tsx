import { renderHook } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  loadProductListConditions,
  type ProductListConditions,
  toProductListQuery,
} from './product-list-params';
import { useProductListUrlState } from './search-params';

import { productQueries } from '@/entities/product';

const listQueryKey = (conditions: ProductListConditions) =>
  productQueries.list(toProductListQuery(conditions)).queryKey;

const clientQueryKey = (searchParams: string) => {
  const { result } = renderHook(() => useProductListUrlState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NuqsTestingAdapter searchParams={searchParams}>
        {children}
      </NuqsTestingAdapter>
    ),
  });

  return listQueryKey(result.current.conditions);
};

const serverQueryKey = async (searchParams: string) =>
  listQueryKey(await loadProductListConditions(Promise.resolve(searchParams)));

describe('서버 loader와 브라우저 hook', () => {
  it.each([
    ['조건이 모두 있는 주소', '?q=의자&category=home&sort=popular&page=3'],
    ['조건이 없는 주소', ''],
    ['앞뒤 공백이 있는 검색어', '?q=%20%20의자%20%20'],
    ['알 수 없는 정렬과 범위를 벗어난 page', '?sort=hack&page=0'],
    ['알 수 없는 카테고리', '?category=unknown'],
  ])('%s에서 같은 queryKey를 만든다', async (_, searchParams) => {
    expect(clientQueryKey(searchParams)).toEqual(
      await serverQueryKey(searchParams),
    );
  });

  it('기본값은 1페이지 전체 카테고리 최신순이다', async () => {
    expect(await serverQueryKey('')).toEqual([
      'products',
      'list',
      {
        q: '',
        category: 'all',
        sort: 'latest',
        page: 1,
        pageSize: 12,
        scenario: null,
      },
    ]);
  });
});
