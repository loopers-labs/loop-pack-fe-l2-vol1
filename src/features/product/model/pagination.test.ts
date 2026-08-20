import { describe, expect, it } from 'vitest';

import { countTotalPages } from './pagination';

describe('총 페이지 수 계산', () => {
  it('마지막에 남는 상품도 한 페이지를 차지한다', () => {
    expect(countTotalPages(13, 12)).toBe(2);
    expect(countTotalPages(25, 12)).toBe(3);
  });

  it('페이지 크기로 딱 나눠떨어지면 페이지를 더 만들지 않는다', () => {
    expect(countTotalPages(12, 12)).toBe(1);
    expect(countTotalPages(24, 12)).toBe(2);
  });

  it('결과가 0건이어도 페이지 수는 1이다', () => {
    expect(countTotalPages(0, 12)).toBe(1);
  });
});
