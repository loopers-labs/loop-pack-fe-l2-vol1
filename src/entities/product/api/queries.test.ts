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
