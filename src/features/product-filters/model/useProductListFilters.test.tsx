// [AI] useProductListFilters 훅의 URL 상태 계약 검증.
// nuqs testing adapter로 URL ↔ state 동기화, history:'push', 필터 변경 시 page 리셋을 확인한다.
// (.test.tsx는 config Test Projects가 자동으로 jsdom에서 돌린다.)

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { useProductListFilters, PAGE_SIZE } from './useProductListFilters';

// [AI] hasMemory:true — setter 호출이 adapter의 URL 스냅샷에 반영되어
// 훅의 반환값이 실제 브라우저처럼 갱신되도록 한다.
const createWrapper =
  (searchParams = '', onUrlUpdate?: OnUrlUpdateFunction) =>
  ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
      {children}
    </NuqsTestingAdapter>
  );

const renderFilters = (searchParams = '', onUrlUpdate?: OnUrlUpdateFunction) =>
  renderHook(() => useProductListFilters(), {
    wrapper: createWrapper(searchParams, onUrlUpdate),
  });

afterEach(() => {
  cleanup();
});

describe('useProductListFilters — 기본값', () => {
  it('URL이 비어있을 때 q="", category="all", sort="latest", page=1 이 기본값', () => {
    const { result } = renderFilters();
    expect(result.current.q).toBe('');
    expect(result.current.category).toBe('all');
    expect(result.current.sort).toBe('latest');
    expect(result.current.page).toBe(1);
  });

  it('query는 sort="latest"를 항상 명시하며 pageSize는 고정값', () => {
    const { result } = renderFilters();
    expect(result.current.query).toEqual({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: PAGE_SIZE,
    });
  });

  it('scenario는 query에 노출되지 않는다', () => {
    const { result } = renderFilters('?scenario=error');
    expect(result.current.query).not.toHaveProperty('scenario');
  });
});

describe('useProductListFilters — URL → state 복원 (공유/새로고침/앞뒤 이동)', () => {
  // it.each([...])() -> 커링 패턴: 테스트 데이터 배열을 가지고 새로운 함수를 반환한다.
  it.each([
    ['?q=rocky', { q: 'rocky', category: 'all', sort: 'latest', page: 1 }],
    ['?category=digital', { q: '', category: 'digital', sort: 'latest', page: 1 }],
    ['?sort=popular', { q: '', category: 'all', sort: 'popular', page: 1 }],
    ['?page=3', { q: '', category: 'all', sort: 'latest', page: 3 }],
    [
      '?q=stanley&category=home&sort=price-asc&page=2',
      { q: 'stanley', category: 'home', sort: 'price-asc', page: 2 },
    ],
  ])('URL %s 로 들어오면 상태가 복원된다', (url, expected) => {
    const { result } = renderFilters(url);
    expect(result.current).toMatchObject(expected);
  });

  it('한글 검색어도 round-trip된다', () => {
    const { result } = renderFilters(`?q=${encodeURIComponent('스탠리')}`);
    expect(result.current.q).toBe('스탠리');
  });

  it('리터럴에 없는 category/sort는 기본값으로 떨어진다', () => {
    const { result } = renderFilters('?category=food&sort=random');
    expect(result.current.category).toBe('all');
    expect(result.current.sort).toBe('latest');
  });
});

describe('useProductListFilters — history: "push"', () => {
  // [AI] nuqs setter는 내부적으로 비동기 URL 업데이트를 예약하므로
  // 반드시 await act(async () => ...) 로 플러시해야 onUrlUpdate 가 관측된다.
  it('모든 변경이 history:"push" 옵션으로 URL에 기록된다', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const { result } = renderFilters('', onUrlUpdate);

    await act(async () => result.current.setQ('shirt'));
    await act(async () => result.current.setCategory('digital'));
    await act(async () => result.current.setSort('popular'));
    await act(async () => result.current.setPage(2));

    expect(onUrlUpdate.mock.calls.length).toBeGreaterThan(0);
    for (const [event] of onUrlUpdate.mock.calls) {
      expect(event.options.history).toBe('push');
    }
  });
});

describe('useProductListFilters — 필터 변경 시 page 1 리셋', () => {
  it('setQ 가 page를 1로 되돌린다', async () => {
    const { result } = renderFilters('?page=5');
    expect(result.current.page).toBe(5);
    await act(async () => result.current.setQ('shirt'));
    expect(result.current.q).toBe('shirt');
    expect(result.current.page).toBe(1);
  });

  it('setCategory 가 page를 1로 되돌린다', async () => {
    const { result } = renderFilters('?page=5');
    await act(async () => result.current.setCategory('digital'));
    expect(result.current.category).toBe('digital');
    expect(result.current.page).toBe(1);
  });

  it('setSort 가 page를 1로 되돌린다', async () => {
    const { result } = renderFilters('?page=5');
    await act(async () => result.current.setSort('popular'));
    expect(result.current.sort).toBe('popular');
    expect(result.current.page).toBe(1);
  });

  it('setPage 는 q/category/sort 를 건드리지 않는다', async () => {
    const { result } = renderFilters('?q=shirt&category=digital&sort=popular');
    await act(async () => result.current.setPage(4));
    expect(result.current).toMatchObject({
      q: 'shirt',
      category: 'digital',
      sort: 'popular',
      page: 4,
    });
  });

  it('검색어를 지우면 q가 비워지고 page도 1로 돌아간다', async () => {
    const { result } = renderFilters('?q=shirt&page=4');
    await act(async () => result.current.setQ(''));
    expect(result.current.q).toBe('');
    expect(result.current.page).toBe(1);
  });
});

describe('useProductListFilters — query 출력 일관성', () => {
  it('여러 필터를 바꾼 뒤에도 query가 ProductListQuery 계약을 만족한다', async () => {
    const { result } = renderFilters();
    await act(async () => result.current.setCategory('fashion'));
    await act(async () => result.current.setSort('price-desc'));
    await act(async () => result.current.setPage(2));
    expect(result.current.query).toEqual({
      q: '',
      category: 'fashion',
      sort: 'price-desc',
      page: 2,
      pageSize: PAGE_SIZE,
    });
  });
});
