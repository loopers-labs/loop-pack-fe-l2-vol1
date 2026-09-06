import { describe, expect, it } from 'vitest';
import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';
import type { ProductListResponse } from '@/entities/product/model/types';
import {
  getNextProductPageParam,
  productListInfiniteQueryOptions,
} from './productQueries';

function makePage(
  page: number,
  productIds: string[],
  totalCount: number,
): ProductListResponse {
  return {
    products: productIds.map((id) => ({ id })) as ProductListResponse['products'],
    categories: [],
    totalCount,
    page,
    pageSize: PRODUCT_LIST_DEFAULTS.pageSize,
  };
}

describe('productListInfiniteQueryOptions', () => {
  it('생략한 기본 조건과 명시한 기본 조건은 같은 query key를 만든다', () => {
    const omittedDefaults = productListInfiniteQueryOptions({}).queryKey;
    const explicitDefaults = productListInfiniteQueryOptions({
      category: 'all',
      sort: PRODUCT_LIST_DEFAULTS.sort,
      pageSize: PRODUCT_LIST_DEFAULTS.pageSize,
    }).queryKey;

    expect(omittedDefaults).toEqual(explicitDefaults);
  });

  it('검색·카테고리·정렬·크기·시나리오는 포함하고 페이지 번호는 제외한다', () => {
    const queryKey = productListInfiniteQueryOptions({
      q: '스탠리',
      category: 'home',
      sort: 'price-asc',
      page: 9,
      pageSize: 6,
      scenario: 'slow',
    }).queryKey;

    expect(queryKey).toEqual([
      'products',
      'infinite',
      {
        q: '스탠리',
        category: 'home',
        sort: 'price-asc',
        pageSize: 6,
        scenario: 'slow',
      },
    ]);
  });
});

describe('getNextProductPageParam', () => {
  it('전체 상품이 남아 있으면 다음 페이지 번호를 반환한다', () => {
    const firstPage = makePage(1, ['p1', 'p2'], 3);

    expect(getNextProductPageParam(firstPage, [firstPage])).toBe(2);
  });

  it('전체 상품을 모두 불러오면 다음 페이지를 요청하지 않는다', () => {
    const firstPage = makePage(1, ['p1', 'p2'], 3);
    const secondPage = makePage(2, ['p3'], 3);

    expect(
      getNextProductPageParam(secondPage, [firstPage, secondPage]),
    ).toBeUndefined();
  });
});
