import { hashKey } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { productListQueryOptions } from '../api/productListQueries';
import { toProductListQuery, toProductListQueryFromSearchParams } from './toProductListQuery';

/**
 * 검증 항목 2 — URL 조건 → query key (단위)
 *
 * 사용자에게 query key 라는 것은 없다. 사용자가 겪는 것은 **"조건을 바꿨는데 목록이 그대로다"**
 * 또는 **"같은 조건인데 매번 다시 로딩한다"** 둘뿐이다. 그 두 가지를 가르는 것이 캐시 키다.
 *
 * 그래서 단언 대상은 queryKey 배열의 모양이 아니라 `hashKey` 다. React Query 는 이 해시가
 * 같으면 같은 캐시 엔트리를 쓴다. 배열을 깊은 비교하면 캐시 동작과 무관한 것(키 순서)까지
 * 잠가 리팩터링을 막는다.
 *
 * DOM 없이 검증한다. URL → 조회 조건 → key 전 구간이 순수 함수다.
 */

/** 이 링크로 들어왔을 때 어느 캐시 자리를 쓰는가. */
const cacheSlotOf = (params: Record<string, string | string[] | undefined>) =>
  hashKey(productListQueryOptions.list(toProductListQueryFromSearchParams(params)).queryKey);

describe('조건을 바꿨을 때 목록을 다시 받는가', () => {
  const base = { q: '셔츠', category: 'home', sort: 'popular', page: '2' };

  it.each([
    ['검색어를 바꾸면', { ...base, q: '바지' }],
    ['카테고리를 바꾸면', { ...base, category: 'digital' }],
    ['정렬을 바꾸면', { ...base, sort: 'price-asc' }],
    ['페이지를 넘기면', { ...base, page: '3' }],
    ['시나리오가 달라지면', { ...base, scenario: 'empty' }],
  ])('%s 이전 목록이 아니라 새 목록을 받는다', (_label, changed) => {
    expect(cacheSlotOf(changed)).not.toBe(cacheSlotOf(base));
  });
});

describe('같은 목록을 다시 볼 때 재요청하지 않는가', () => {
  it('같은 조건으로 다시 들어오면 이미 받아둔 목록을 그대로 쓴다', () => {
    expect(cacheSlotOf({ category: 'home', page: '2' })).toBe(cacheSlotOf({ category: 'home', page: '2' }));
  });

  it('조건 순서만 다른 링크는 같은 목록으로 본다', () => {
    expect(cacheSlotOf({ page: '2', category: 'home' })).toBe(cacheSlotOf({ category: 'home', page: '2' }));
  });

  /**
   * 정규화가 캐시까지 이어지는지 — 항목 2와 항목 3을 잇는 지점이다.
   * 잘못된 조건이 기본값으로 떨어졌다면 사용자가 보는 목록도 기본 조건 목록과 같다.
   * 그런데 캐시 자리가 갈리면 같은 화면을 두 번 받아오게 된다.
   */
  it.each([
    ['페이지 번호가 없는 링크', {}, { page: '1' }],
    ['잘못된 페이지 번호가 담긴 링크', { page: '0' }, { page: '1' }],
    ['없는 정렬이 담긴 링크', { sort: 'nope' }, { sort: 'latest' }],
    ['없는 카테고리가 담긴 링크', { category: 'nope' }, { category: 'all' }],
    ['공백만 검색한 링크', { q: '   ' }, {}],
  ])('%s는 기본 조건 목록과 같은 결과를 같은 자리에서 본다', (_label, raw, normalized) => {
    expect(cacheSlotOf(raw)).toBe(cacheSlotOf(normalized));
  });

  // 경계 — 시나리오는 사용자가 고르는 조건이 아니지만 응답을 바꾼다
  it('없는 시나리오가 담긴 링크는 시나리오 없이 들어온 것과 같은 목록을 본다', () => {
    expect(cacheSlotOf({ scenario: 'nope' })).toBe(cacheSlotOf({}));
  });
});

describe('조회 조건에 붙는 값', () => {
  const filter = { q: '', category: 'all', sort: 'latest', page: 1 } as const;

  it('목록은 한 번에 12개씩 받아온다', () => {
    expect(toProductListQuery(filter).pageSize).toBe(12);
  });

  it('시나리오를 지정하지 않으면 평소 응답을 받는다', () => {
    expect(toProductListQuery(filter).scenario).toBeUndefined();
  });

  it('지연 시나리오로 들어오면 그 조건이 요청까지 전달된다', () => {
    expect(toProductListQuery(filter, 'slow').scenario).toBe('slow');
  });
});
