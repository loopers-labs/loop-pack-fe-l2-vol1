import { describe, expect, it } from 'vitest';

import { productQueries } from './queries';
import type { ProductListQuery, ProductListResponse } from './types';

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
  it('루트 키는 상품 도메인만 가리킨다', () => {
    expect(productQueries.all()).toEqual(['products']);
  });

  it('모든 키가 루트 키로 시작해 한 번에 무효화할 수 있다', () => {
    const all = productQueries.all();

    for (const { queryKey } of [
      productQueries.home(),
      productQueries.list(CONDITIONS),
    ]) {
      expect(queryKey.slice(0, all.length)).toEqual(all);
    }
  });
});

describe('목록 쿼리의 placeholderData', () => {
  it.each([
    ['검색어', { q: '책상' }],
    ['카테고리', { category: 'digital' as const }],
    ['정렬', { sort: 'latest' as const }],
    ['페이지', { page: 2 }],
  ])('%s가 달라져도 새 목록이 올 때까지 이전 목록을 보여준다', (_, changed) => {
    expect(keepPreviousList(changed, PREVIOUS_DATA)).toBe(PREVIOUS_DATA);
  });

  it('이전 목록이 없으면 보여줄 것도 없다', () => {
    expect(keepPreviousList({}, undefined)).toBeUndefined();
  });
});
