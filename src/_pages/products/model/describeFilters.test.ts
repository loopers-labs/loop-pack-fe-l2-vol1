import { describe, expect, it } from 'vitest';
import { describeFilters } from './describeFilters';

// 0건 화면이 "왜 0건인지"를 사용자에게 설명하는 유일한 문구다.
describe('describeFilters', () => {
  it('검색어와 카테고리가 모두 있으면 둘 다 문구에 넣는다', () => {
    expect(describeFilters({ q: '셔츠', category: 'casual' })).toBe(
      '검색 "셔츠" · 카테고리 캐주얼',
    );
  });

  it('검색어만 있으면 검색어만 넣는다', () => {
    expect(describeFilters({ q: '셔츠' })).toBe('검색 "셔츠"');
  });

  it('카테고리가 all이면 조건이 아니므로 문구에서 뺀다', () => {
    expect(describeFilters({ q: '셔츠', category: 'all' })).toBe('검색 "셔츠"');
  });

  it('조건이 하나도 없으면 전체 목록이라고 한다', () => {
    expect(describeFilters({})).toBe('전체 목록');
  });

  it('빈 검색어와 all 카테고리는 조건 없음과 같게 다룬다', () => {
    expect(describeFilters({ q: '', category: 'all' })).toBe('전체 목록');
  });

  it('정렬·페이지는 0건의 이유가 아니므로 문구에 넣지 않는다', () => {
    expect(describeFilters({ sort: 'price-desc', page: 3 })).toBe('전체 목록');
  });
});
