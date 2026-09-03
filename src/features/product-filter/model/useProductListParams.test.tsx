import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProductListParams } from './useProductListParams';
import { initAnalytics, registerProviders, resetAnalyticsForTest } from '@/analytics/logger';
import { resetAnalyticsSetupForTest, setupAnalytics } from '@/analytics/setup';
import { productsQueryOptions } from '@/entities/product/api/productsQueryOptions';
import type { AnalyticsProvider } from '@/analytics/provider';

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

/**
 * 조건 변경 이벤트의 발생 단위를 고정한다.
 *
 * 클릭이 아니라 조건이 실제로 바뀐 것을 센다. 같은 값을 다시 고른 것까지 세면 "몇 번
 * 바꿨나"가 부풀려지고, URL 갱신보다 먼저 기록하면 갱신에 실패한 시도까지 남는다.
 */

const trace: string[] = [];

const captureProvider: AnalyticsProvider = {
  name: 'capture',
  initialize() {},
  track(event) {
    trace.push(event);
  },
  identify() {},
  reset() {},
};

function renderParamsWithTrace(searchParams: string) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <NuqsTestingAdapter
      searchParams={searchParams}
      onUrlUpdate={() => {
        trace.push('url');
      }}
    >
      {children}
    </NuqsTestingAdapter>
  );
  return renderHook(() => useProductListParams(), { wrapper });
}

describe('조건 변경 이벤트', () => {
  beforeEach(async () => {
    trace.length = 0;
    resetAnalyticsForTest();
    resetAnalyticsSetupForTest();
    window.sessionStorage.clear();
    setupAnalytics({ readUserId: () => null });
    registerProviders([captureProvider]);
    await initAnalytics();
  });

  it('URL이 갱신된 뒤에 기록한다', async () => {
    const { result } = renderParamsWithTrace('?category=all');

    await act(() => result.current.setCategory('casual'));

    expect(trace).toEqual(['url', 'category_filter_change']);
  });

  it('같은 카테고리를 다시 고르면 아무 이벤트도 남지 않는다', async () => {
    const { result } = renderParamsWithTrace('?category=casual');

    await act(() => result.current.setCategory('casual'));

    expect(trace).toEqual([]);
  });

  it('같은 정렬·같은 페이지를 다시 골라도 남지 않는다', async () => {
    const { result } = renderParamsWithTrace('?sort=popular&page=2');

    await act(() => result.current.setSort('popular'));
    await act(() => result.current.setPage(2));

    expect(trace).toEqual([]);
  });

  it('정렬과 페이지가 실제로 바뀌면 각각 한 번씩 남는다', async () => {
    const { result } = renderParamsWithTrace('?sort=latest&page=1');

    await act(() => result.current.setSort('popular'));
    await act(() => result.current.setPage(2));

    expect(trace.filter((row) => row !== 'url')).toEqual(['sort_change', 'page_change']);
  });
});
