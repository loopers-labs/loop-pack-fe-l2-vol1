import { describe, expect, it } from 'vitest';
import { toProductsQueryInput } from './toProductsQueryInput';

/* AI-generated : metadata·본문이 같은 함수를 거쳐 같은 모양의 입력을 만드는지 검증 */
describe('toProductsQueryInput', () => {
  it('loadProductSearchParams가 파싱한 q/category/sort/page만 그대로 뽑아낸다', () => {
    const query = { q: '셔츠', category: 'digital', sort: 'price-asc', page: 2 } as const;

    expect(toProductsQueryInput(query)).toEqual({
      q: '셔츠',
      category: 'digital',
      sort: 'price-asc',
      page: 2,
    });
  });
});
