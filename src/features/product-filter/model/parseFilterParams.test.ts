import { describe, expect, it } from 'vitest';

import { DEFAULT_FILTER_STATE, parseFilterParams } from './parseFilterParams';

/**
 * 검증 항목 3 — 직접 고른 순수 로직 (단위)
 *
 * 이 함수가 다루는 것은 **사용자가 받은 링크**다. 목록 조건은 URL 이 원본이라
 * 공유·재진입·북마크로 들어오는 모든 경로가 여기를 지난다.
 * UI 로는 만들 수 없는 값이라도 링크로는 들어온다 — 손으로 고친 주소, 오래된 공유 링크,
 * 크롤러가 그렇다. 그래서 "잘못된 링크로 들어왔을 때 사용자가 무엇을 보는가"가 검증 대상이다.
 *
 * 어긋나면 화면은 정상으로 보이고 metadata 만 다른 조건을 가리킨다 — 눈으로 안 잡히는 버그다.
 */
describe('링크로 목록에 들어왔을 때', () => {
  it('조건 없는 링크로 들어오면 전체 카테고리를 최신순 첫 페이지로 본다', () => {
    expect(parseFilterParams({})).toEqual(DEFAULT_FILTER_STATE);
  });

  it('공유받은 링크의 검색어·카테고리·정렬·페이지가 그대로 적용된다', () => {
    expect(parseFilterParams({ q: '셔츠', category: 'fashion', sort: 'price-asc', page: '3' })).toEqual({
      q: '셔츠',
      category: 'fashion',
      sort: 'price-asc',
      page: 3,
    });
  });

  it('추적용 파라미터가 붙은 링크로 들어와도 보는 목록은 달라지지 않는다', () => {
    expect(parseFilterParams({ scenario: 'error', utm_source: 'x' })).toEqual(DEFAULT_FILTER_STATE);
  });

  describe('같은 조건이 두 번 담긴 링크', () => {
    it('앞의 조건으로 목록을 본다', () => {
      const result = parseFilterParams({
        q: ['셔츠', '바지'],
        category: ['home', 'digital'],
        sort: ['popular', 'latest'],
        page: ['2', '5'],
      });

      expect(result).toEqual({ q: '셔츠', category: 'home', sort: 'popular', page: 2 });
    });

    // 경계 — 조건 이름만 있고 값이 없는 경우
    it('값이 비어 있으면 그 조건은 없는 것으로 보고 기본 목록을 본다', () => {
      expect(parseFilterParams({ category: [], sort: [], page: [] })).toEqual(DEFAULT_FILTER_STATE);
    });
  });

  describe('없어졌거나 잘못된 조건이 담긴 링크', () => {
    it('없는 카테고리가 담겨 있으면 빈 화면 대신 전체 카테고리 목록을 본다', () => {
      expect(parseFilterParams({ category: 'nope' }).category).toBe('all');
    });

    it('없는 정렬이 담겨 있으면 최신순 목록을 본다', () => {
      expect(parseFilterParams({ sort: 'price' }).sort).toBe('latest');
    });

    // 경계 — 대소문자만 다른 값도 통과시키지 않는다
    it('카테고리 대소문자가 다르면 전체 카테고리 목록을 본다', () => {
      expect(parseFilterParams({ category: 'Fashion' }).category).toBe('all');
    });
  });

  describe('페이지 번호가 잘못된 링크', () => {
    it.each([
      ['0', '0 페이지'],
      ['-1', '음수 페이지'],
      ['1.5', '소수 페이지'],
      ['abc', '숫자가 아닌 값'],
      ['', '값이 빈 페이지'],
      ['9'.repeat(400), '자릿수가 터무니없이 큰 값'],
    ])('%s(%s)이 담겨 있으면 빈 화면 대신 첫 페이지를 본다', (page) => {
      expect(parseFilterParams({ page }).page).toBe(1);
    });

    it('첫 페이지 링크로 들어오면 첫 페이지를 본다', () => {
      expect(parseFilterParams({ page: '1' }).page).toBe(1);
    });

    /**
     * 경계 — 안전 정수 상한.
     * 여기까지는 조회 조건으로 통과시킨다. 결과가 0건인 것은 목록이 답할 일이지
     * 링크를 읽는 이 함수가 미리 잘라낼 일이 아니다.
     */
    it('아주 크지만 유효한 페이지 번호는 그대로 조회 조건이 된다', () => {
      expect(parseFilterParams({ page: String(Number.MAX_SAFE_INTEGER) }).page).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('검색어', () => {
    it('앞뒤 공백을 넣어 검색해도 공백 없이 검색한 것과 같은 목록을 본다', () => {
      expect(parseFilterParams({ q: '  셔츠  ' }).q).toBe('셔츠');
    });

    // 경계 — 공백만 입력한 검색은 조건 없음과 같아야 한다
    it('공백만 입력하고 검색하면 검색어 없이 조회한 목록을 본다', () => {
      expect(parseFilterParams({ q: '   ' }).q).toBe('');
    });

    it('검색어가 없는 링크로 들어오면 검색어 없이 조회한 목록을 본다', () => {
      expect(parseFilterParams({}).q).toBe('');
    });
  });
});
