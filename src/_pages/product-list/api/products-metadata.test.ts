// 테스트 케이스 정리 (week08-test-plan.md 항목 3)
// 정상: 1) 검색어가 있으면 title에 검색어 포함
//       2) 검색어 없이 카테고리만 있으면 title에 카테고리명 포함
//       3) 검색어/카테고리 둘 다 없으면 title 기본값("상품 둘러보기")
//       4) category/sort 조합에 따라 description이 조립됨
// 경계: 5) page가 2 이상이면 title 끝에 "- N페이지"가 붙음
//       6) 검색어와 카테고리가 동시에 있으면 검색어가 우선(카테고리 무시)
//       7) category가 'all'이면 카테고리명이 title/description에 반영되지 않음
//       8) 검색어/카테고리/정렬이 전부 없으면 description이 기본 문구로 나옴
import { describe, expect, it } from 'vitest';
import { buildProductsMetadataText } from './products-metadata';
import type { ProductListResponse } from '@/entities/product/model';

const baseData: ProductListResponse = {
  products: [],
  categories: [],
  totalCount: 10,
  page: 1,
  pageSize: 12,
};

describe('buildProductsMetadataText — 정상 케이스', () => {
  it('검색어가 있으면 title에 검색어가 포함된다', () => {
    const result = buildProductsMetadataText({
      query: { q: '가디건' },
      data: baseData,
    });
    expect(result.title).toBe("'가디건' 검색 결과");
  });

  it('검색어 없이 카테고리만 있으면 title에 카테고리명이 포함된다', () => {
    const result = buildProductsMetadataText({
      query: { category: 'casual' },
      data: baseData,
    });
    expect(result.title).toBe('캐주얼 상품');
  });

  it('검색어와 카테고리가 둘 다 없으면 title은 기본값이다', () => {
    const result = buildProductsMetadataText({
      query: {},
      data: baseData,
    });
    expect(result.title).toBe('상품 둘러보기');
  });

  it('category와 sort가 있으면 description에 둘 다 반영된다', () => {
    const result = buildProductsMetadataText({
      query: { category: 'fashion', sort: 'price-asc' },
      data: { ...baseData, totalCount: 25 },
    });
    expect(result.description).toBe('패션 · 낮은 가격순 카테고리의 상품 25개를 확인해보세요.');
  });
});

describe('buildProductsMetadataText — 경계 케이스', () => {
  it('page가 2 이상이면 title 끝에 페이지 번호가 붙는다', () => {
    const result = buildProductsMetadataText({
      query: { category: 'home', page: 3 },
      data: baseData,
    });
    expect(result.title).toBe('홈 상품 - 3페이지');
  });

  it('검색어와 카테고리가 동시에 있으면 검색어가 우선한다', () => {
    const result = buildProductsMetadataText({
      query: { q: '가디건', category: 'casual' },
      data: baseData,
    });
    expect(result.title).toBe("'가디건' 검색 결과");
  });

  it("category가 'all'이면 카테고리명이 반영되지 않는다", () => {
    const result = buildProductsMetadataText({
      query: { category: 'all' },
      data: baseData,
    });
    expect(result.title).toBe('상품 둘러보기');
    expect(result.description).toBe('카테고리와 가격 조건으로 상품 10개를 찾아보세요.');
  });

  it('검색어·카테고리·정렬이 전부 없으면 description은 기본 문구다', () => {
    const result = buildProductsMetadataText({
      query: {},
      data: { ...baseData, totalCount: 0 },
    });
    expect(result.description).toBe('카테고리와 가격 조건으로 상품 0개를 찾아보세요.');
  });
});