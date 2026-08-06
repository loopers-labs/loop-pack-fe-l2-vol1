import { keepPreviousData } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { productsQueryOptions } from './productsQueryOptions';
import { PRODUCT_LIST_RETRY_COUNT } from '../model/constants';

const QUERY = { category: 'all', sort: 'latest', page: 1, pageSize: 12 } as const;

describe('productsQueryOptions', () => {
  it('갱신 실패를 빠르게 알리도록 자동 재시도를 1회 이하로 묶는다', () => {
    // React Query 기본값 3회를 그대로 두면 지수 백오프까지 겹쳐 실패 노출이 9초 넘게 밀린다(Part 4 실측).
    // 정확한 값보다 "상한이 있다"는 것이 지켜야 할 성질이라 부등호로 고정한다.
    const { retry } = productsQueryOptions(QUERY);

    expect(retry).toBe(PRODUCT_LIST_RETRY_COUNT);
    expect(PRODUCT_LIST_RETRY_COUNT).toBeLessThanOrEqual(1);
  });

  it('조건이 바뀌어도 목록을 비우지 않도록 이전 데이터를 유지한다', () => {
    expect(productsQueryOptions(QUERY).placeholderData).toBe(keepPreviousData);
  });
});
