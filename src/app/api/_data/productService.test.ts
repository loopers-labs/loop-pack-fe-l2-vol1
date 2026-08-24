import { describe, expect, it } from 'vitest';
import { getProductList } from './productService';

const getProducts = (params: Parameters<typeof getProductList>[0]) =>
  getProductList(params).products;

const getIds = (params: Parameters<typeof getProductList>[0]) =>
  getProducts(params).map((product) => product.id);

describe('getProductList', () => {
  it('검색어 앞뒤 공백과 영문 대소문자를 무시해 상품 이름을 찾는다', () => {
    expect(getIds({ q: '  winter ROCKY  ', pageSize: 30 })).toEqual(['p1']);
  });

  it('카테고리를 지정하면 해당 상품만 반환하고 all은 전체 상품을 반환한다', () => {
    const casual = getProductList({ category: 'casual', pageSize: 30 });
    const all = getProductList({ category: 'all', pageSize: 30 });

    expect(casual.totalCount).toBe(6);
    expect(casual.products.every((product) => product.category === 'casual')).toBe(
      true,
    );
    expect(all.totalCount).toBe(30);
  });

  it('최신순은 등록일이 늦은 상품부터 빠짐없이 반환한다', () => {
    const products = getProducts({ sort: 'latest', pageSize: 30 });
    const timestamps = products.map((product) =>
      Date.parse(product.createdAt),
    );

    expect(products).toHaveLength(30);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });

  it('인기순은 리뷰 수가 많고 리뷰 수가 같으면 평점이 높은 상품부터 반환한다', () => {
    const products = getProducts({ sort: 'popular', pageSize: 30 });
    const inversions = products.slice(1).filter((product, index) => {
      const previous = products[index];

      return (
        previous.reviewCount < product.reviewCount ||
        (previous.reviewCount === product.reviewCount &&
          previous.rating < product.rating)
      );
    });

    expect(products).toHaveLength(30);
    expect(inversions).toEqual([]);
  });

  it('가격순은 모든 상품을 유지하면서 가격이 낮거나 높은 순서로 반환한다', () => {
    const ascending = getProducts({ sort: 'price-asc', pageSize: 30 });
    const descending = getProducts({ sort: 'price-desc', pageSize: 30 });
    const ascendingPrices = ascending.map((product) => product.price);
    const descendingPrices = descending.map((product) => product.price);

    expect(new Set(ascending.map((product) => product.id)).size).toBe(30);
    expect(new Set(descending.map((product) => product.id)).size).toBe(30);
    expect(ascendingPrices).toEqual(
      [...ascendingPrices].sort((a, b) => a - b),
    );
    expect(descendingPrices).toEqual(
      [...descendingPrices].sort((a, b) => b - a),
    );
  });

  it('페이지 크기에 따라 겹치지 않는 상품 묶음을 반환한다', () => {
    const firstPage = getProductList({ page: 1, pageSize: 2 });
    const secondPage = getProductList({ page: 2, pageSize: 2 });

    expect(firstPage.products.map((product) => product.id)).toEqual(['p26', 'p6']);
    expect(secondPage.products.map((product) => product.id)).toEqual(['p27', 'p24']);
    expect(secondPage).toMatchObject({ totalCount: 30, page: 2, pageSize: 2 });
  });

  it('마지막 페이지를 넘으면 전체 개수는 유지하고 빈 상품 목록을 반환한다', () => {
    const result = getProductList({ category: 'casual', page: 9, pageSize: 12 });

    expect(result.products).toEqual([]);
    expect(result).toMatchObject({ totalCount: 6, page: 9, pageSize: 12 });
  });
});
