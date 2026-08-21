import { createSerializer } from 'nuqs/server';
import { describe, expect, it } from 'vitest';

import {
  conditionParsers,
  loadProductListConditions,
  type ProductListConditions,
  toProductListQuery,
} from './product-list-params';

// 주소에서 조회 조건이 나오는 데까지만 본다.
// 이 조건이 캐시 키에 실리는지는 queries.test.ts가 맡는다.
const conditionsFor = (searchParams: string) =>
  toProductListQuery(loadProductListConditions(searchParams));

const serializeConditions = createSerializer(conditionParsers);

describe('URL 조회 조건', () => {
  it('필터 객체를 주소로 만든 뒤 다시 읽으면 같은 조건이 된다', () => {
    const conditions = {
      q: '의자',
      category: 'home',
      sort: 'popular',
      scenario: null,
      page: 3,
    } satisfies ProductListConditions;

    expect(loadProductListConditions(serializeConditions(conditions))).toEqual(
      conditions,
    );
  });

  it('조건이 모두 담긴 주소는 그 조건 그대로 읽힌다', () => {
    expect(conditionsFor('?q=의자&category=home&sort=popular&page=3')).toEqual({
      q: '의자',
      category: 'home',
      sort: 'popular',
      scenario: null,
      page: 3,
      pageSize: 12,
    });
  });

  it('조건이 없는 주소는 전체 카테고리 최신순 1페이지로 채운다', () => {
    expect(conditionsFor('')).toEqual({
      q: '',
      category: 'all',
      sort: 'latest',
      scenario: null,
      page: 1,
      pageSize: 12,
    });
  });

  it('검색어 앞뒤 공백을 지워 같은 검색어가 같은 조건이 되게 한다', () => {
    expect(conditionsFor('?q=%20%20의자%20%20')).toEqual(
      conditionsFor('?q=의자'),
    );
  });

  // 한글은 입력기에 따라 자모가 분리된 형태로 들어온다. 이걸 합치지 않으면
  // 눈에는 같은 검색어인데 서버와 브라우저가 서로 다른 캐시를 쓴다.
  it('자모가 분리된 검색어도 합쳐 같은 조건이 되게 한다', () => {
    const decomposed = '의자'.normalize('NFD');

    expect(conditionsFor(`?q=${decomposed}`)).toEqual(conditionsFor('?q=의자'));
  });

  it('알 수 없는 카테고리와 정렬은 기본값으로 되돌린다', () => {
    expect(conditionsFor('?category=unknown&sort=hack')).toEqual(
      conditionsFor(''),
    );
  });

  it.each(['0', '-1', '1.5', 'abc'])(
    'page=%s처럼 1 이상의 정수가 아니면 1페이지로 되돌린다',
    (page) => {
      expect(conditionsFor(`?page=${page}`)).toEqual(conditionsFor(''));
    },
  );
});
