import { describe, expect, it } from 'vitest';
import { productQueries } from '../api/products.queries';
import { loadProductFilters } from './productFilterParsers';

// 서버(generateMetadata·본문 prefetch)와 클라이언트가 같은 파서를 쓰므로,
// "같은 URL이면 같은 query key"가 깨지면 같은 화면이 요청을 두 번 보내거나
// 서버가 채운 캐시를 클라이언트가 못 찾는다.
const keyOf = (searchParams: Record<string, string>) =>
  productQueries.list(loadProductFilters(searchParams)).queryKey;

describe('URL 조건 → query key', () => {
  it('조건이 없으면 기본값으로 정규화된 키를 만든다', () => {
    expect(keyOf({})).toEqual([
      'products',
      'list',
      { q: '', category: 'all', sort: 'latest', page: 1 },
    ]);
  });

  it('URL의 조건을 그대로 키에 싣는다', () => {
    expect(
      keyOf({ q: '셔츠', category: 'fashion', sort: 'price-asc', page: '2' }),
    ).toEqual([
      'products',
      'list',
      { q: '셔츠', category: 'fashion', sort: 'price-asc', page: 2 },
    ]);
  });

  it('page는 문자열이 아니라 숫자로 들어간다 — "2"와 2가 다른 키가 되면 안 된다', () => {
    const [, , fromUrl] = keyOf({ page: '2' });

    expect(fromUrl).toMatchObject({ page: 2 });
  });

  it('목록에 없는 카테고리는 all로 정규화되어 기본 진입과 같은 키가 된다', () => {
    expect(keyOf({ category: '없는카테고리' })).toEqual(keyOf({}));
  });

  it('목록에 없는 정렬값도 latest로 정규화된다', () => {
    expect(keyOf({ sort: 'newest' })).toEqual(keyOf({}));
  });

  it('page에 숫자가 아닌 값이 오면 1로 정규화된다', () => {
    expect(keyOf({ page: 'abc' })).toEqual(keyOf({}));
  });

  it('조건이 하나라도 다르면 다른 키가 된다', () => {
    expect(keyOf({ page: '2' })).not.toEqual(keyOf({ page: '3' }));
    expect(keyOf({ category: 'fashion' })).not.toEqual(
      keyOf({ category: 'casual' }),
    );
    expect(keyOf({ q: '셔츠' })).not.toEqual(keyOf({ q: '바지' }));
  });

  it('같은 조건이면 URL에 적힌 순서가 달라도 같은 키가 된다', () => {
    expect(keyOf({ sort: 'popular', category: 'home' })).toEqual(
      keyOf({ category: 'home', sort: 'popular' }),
    );
  });
});
