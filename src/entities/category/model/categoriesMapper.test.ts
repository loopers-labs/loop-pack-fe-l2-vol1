import { describe, expect, it } from 'vitest';
import { categoriesMapper } from './categoriesMapper';
import type { Category } from './category';

/* AI-generated : week06-fsd.md 6단계 기준 — 홈 응답 구조에서 categories만 그대로 뽑아내는 순수 함수 검증 */
describe('categoriesMapper', () => {
  it('응답의 categories 배열을 그대로 반환한다', () => {
    const categories: Category[] = [
      { id: 'casual', name: '캐주얼' },
      { id: 'digital', name: '디지털' },
    ];

    expect(categoriesMapper({ categories })).toBe(categories);
  });

  it('categories가 빈 배열이면 빈 배열을 반환한다', () => {
    expect(categoriesMapper({ categories: [] })).toEqual([]);
  });
});
