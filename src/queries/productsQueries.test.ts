import { describe, expect, it } from 'vitest';
import { productsQueries } from '@/queries/productsQueries';

describe('productsQueries — query key와 URL 조건 일치', () => {
  it('query key에 filters 객체 전체가 포함된다', () => {
    const filters = {
      q: 'pants',
      category: 'casual' as const,
      sort: 'latest' as const,
      page: 1,
    };
    const options = productsQueries.productList(filters);
    expect(options.queryKey).toEqual(['products', filters]);
  });

  it('q가 다르면 query key가 달라진다', () => {
    const a = productsQueries.productList({ q: 'pants' });
    const b = productsQueries.productList({ q: 'shirt' });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });

  it('category가 다르면 query key가 달라진다', () => {
    const a = productsQueries.productList({ category: 'all' });
    const b = productsQueries.productList({ category: 'casual' });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });

  it('sort가 다르면 query key가 달라진다', () => {
    const a = productsQueries.productList({ sort: 'latest' });
    const b = productsQueries.productList({ sort: 'popular' });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });

  it('page가 다르면 query key가 달라진다', () => {
    const a = productsQueries.productList({ page: 1 });
    const b = productsQueries.productList({ page: 2 });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });

  it('같은 filters는 같은 query key를 만든다', () => {
    const filters = {
      q: '',
      category: 'all' as const,
      sort: 'latest' as const,
      page: 1,
    };
    const a = productsQueries.productList(filters);
    const b = productsQueries.productList(filters);
    expect(a.queryKey).toEqual(b.queryKey);
  });

  it('query key 최상위는 항상 "products"다', () => {
    const options = productsQueries.productList({});
    expect(options.queryKey[0]).toBe('products');
  });
});
