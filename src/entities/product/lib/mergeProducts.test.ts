import { describe, expect, it } from 'vitest';
import type { Product } from '@/entities/product/model/types';
import { mergeProducts } from './mergeProducts';

const makeProduct = (id: string, name: string) =>
  ({ id, name }) as Product;

describe('mergeProducts', () => {
  it('페이지 순서를 유지하면서 같은 상품 ID를 한 번만 반환한다', () => {
    const first = makeProduct('p1', '첫 상품');
    const duplicate = makeProduct('p1', '갱신된 첫 상품');
    const second = makeProduct('p2', '두 번째 상품');

    expect(
      mergeProducts([
        { products: [first] },
        { products: [duplicate, second] },
      ]),
    ).toEqual([duplicate, second]);
  });
});
