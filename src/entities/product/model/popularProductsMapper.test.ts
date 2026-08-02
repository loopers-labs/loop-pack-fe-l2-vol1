import { describe, expect, it } from 'vitest';
import { popularProductsMapper } from './popularProductsMapper';
import type { Product } from './product';

const PRODUCT: Product = {
  id: 'p1',
  brand: 'Loopers Select',
  name: '테스트 상품',
  category: 'casual',
  price: 10000,
  originalPrice: null,
  image: '/images/products/p1.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.5,
  reviewCount: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

/* AI-generated : week06-fsd.md 6단계 기준 — 홈 응답 구조에서 popularProducts만 그대로 뽑아내는 순수 함수 검증 */
describe('popularProductsMapper', () => {
  it('응답의 popularProducts 배열을 그대로 반환한다', () => {
    const popularProducts = [PRODUCT];

    expect(popularProductsMapper({ popularProducts })).toBe(popularProducts);
  });

  it('popularProducts가 빈 배열이면 빈 배열을 반환한다', () => {
    expect(popularProductsMapper({ popularProducts: [] })).toEqual([]);
  });
});
