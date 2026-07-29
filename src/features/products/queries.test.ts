import { describe, expect, it } from 'vitest';

import { keepPreviousPage, productQueries } from './queries';

import type { ProductListQuery, ProductListResponse } from '@/types/commerce';

const CONDITIONS = {
  q: '의자',
  category: 'home',
  sort: 'popular',
  page: 1,
  pageSize: 12,
} satisfies Required<ProductListQuery>;

const PREVIOUS_DATA = {
  products: [],
  categories: [],
  totalCount: 30,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse;

const keepPreviousList = (changed: Partial<Required<ProductListQuery>>) =>
  keepPreviousPage({ ...CONDITIONS, ...changed })(PREVIOUS_DATA, {
    queryKey: productQueries.list(CONDITIONS).queryKey,
  });

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
  it('목록 쿼리에 연결되어 있다', () => {
    expect(productQueries.list(CONDITIONS).placeholderData).toBeInstanceOf(
      Function,
    );
  });

  it('page만 달라지면 이전 목록을 그대로 보여준다', () => {
    expect(keepPreviousList({ page: 2 })).toBe(PREVIOUS_DATA);
  });

  it.each([
    ['검색어', { q: '책상' }],
    ['카테고리', { category: 'digital' as const }],
    ['정렬', { sort: 'latest' as const }],
    ['페이지 크기', { pageSize: 24 }],
  ])('%s가 달라지면 이전 목록을 남기지 않는다', (_, changed) => {
    expect(keepPreviousList(changed)).toBeUndefined();
  });

  it('이전 쿼리가 없으면 이전 목록을 남기지 않는다', () => {
    expect(keepPreviousPage(CONDITIONS)(undefined, undefined)).toBeUndefined();
  });
});
