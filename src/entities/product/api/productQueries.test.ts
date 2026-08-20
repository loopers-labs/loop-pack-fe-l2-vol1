import { describe, expect, it } from 'vitest';
import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';
import { productListQueryOptions } from './productQueries';

describe('productListQueryOptions', () => {
  it('생략한 기본 조건과 명시한 기본 조건은 같은 query key를 만든다', () => {
    const omittedDefaults = productListQueryOptions({}).queryKey;
    const explicitDefaults = productListQueryOptions({
      category: 'all',
      sort: PRODUCT_LIST_DEFAULTS.sort,
      page: PRODUCT_LIST_DEFAULTS.page,
      pageSize: PRODUCT_LIST_DEFAULTS.pageSize,
    }).queryKey;

    expect(omittedDefaults).toEqual(explicitDefaults);
  });

  it('검색·카테고리·정렬·페이지·시나리오 조건을 query key에 모두 포함한다', () => {
    const queryKey = productListQueryOptions({
      q: '스탠리',
      category: 'home',
      sort: 'price-asc',
      page: 2,
      pageSize: 6,
      scenario: 'slow',
    }).queryKey;

    expect(queryKey).toEqual([
      'products',
      {
        q: '스탠리',
        category: 'home',
        sort: 'price-asc',
        page: 2,
        pageSize: 6,
        scenario: 'slow',
      },
    ]);
  });
});
