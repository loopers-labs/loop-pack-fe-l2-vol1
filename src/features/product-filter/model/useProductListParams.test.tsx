import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import { useProductListParams } from './useProductListParams';
import { productsQueryOptions } from '@/entities/product/api/productsQueryOptions';

function renderWithSearchParams(searchParams: string) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
  );
  const { result } = renderHook(() => useProductListParams(), { wrapper });
  const { q, category, sort, page } = result.current;
  const { queryKey } = productsQueryOptions({ q, category, sort, page });

  return { q, category, sort, page, queryKey };
}

describe('useProductListParams와 query key 일치', () => {
  // Week 08 Step 2 보강 — URL 조건 → query key 경계: 조건 없는 URL의 기본값
  it('URL에 조건이 없으면 기본값으로 해석되고, 그 값이 query key에도 그대로 반영된다', () => {
    const result = renderWithSearchParams('');

    expect(result).toEqual({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      queryKey: ['products', { q: '', category: 'all', sort: 'latest', page: 1 }],
    });
  });

  // Week 08 Step 2 보강 — URL 조건 → query key 정상: 모든 조건 반영
  it('URL에 담긴 조건이 그대로 파싱되고, 그 값이 query key에도 동일하게 반영된다', () => {
    const result = renderWithSearchParams('?category=casual&sort=popular&page=2&q=shoes');

    expect(result).toEqual({
      q: 'shoes',
      category: 'casual',
      sort: 'popular',
      page: 2,
      queryKey: ['products', { q: 'shoes', category: 'casual', sort: 'popular', page: 2 }],
    });
  });

  // Week 08 Step 2 보강 — URL 조건 → query key 경계: page=0 하한 보정
  it('page=0처럼 API가 거부하는 값은 API 요청 전에 1로 하한 보정된다', () => {
    const result = renderWithSearchParams('?page=0');

    expect(result.page).toBe(1);
  });

  // Week 08 Step 2 보강 — URL 조건 → query key 경계: 음수 page 하한 보정
  it('음수 page도 파서가 1로 하한 보정한다', () => {
    const result = renderWithSearchParams('?page=-5');

    expect(result.page).toBe(1);
  });
});
