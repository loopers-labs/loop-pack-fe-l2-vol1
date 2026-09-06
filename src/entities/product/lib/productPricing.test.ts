import { describe, expect, it } from 'vitest';
import type { Product } from '@/entities/product/model/types';
import {
  getProductDiscount,
  getProductPriceSummary,
} from './productPricing';

describe('getProductDiscount', () => {
  it('유효한 원가에서 할인율과 단위 할인 금액을 계산한다', () => {
    expect(
      getProductDiscount({ price: 138_000, originalPrice: 158_000 }),
    ).toEqual({
      originalPrice: 158_000,
      rate: 13,
      unitAmount: 20_000,
    });
  });

  it.each([null, 138_000, 120_000])(
    '원가가 %s이면 할인 정보로 취급하지 않는다',
    (originalPrice) => {
      expect(getProductDiscount({ price: 138_000, originalPrice })).toBeNull();
    },
  );
});

describe('getProductPriceSummary', () => {
  it('여러 상품과 수량을 반영해 원가, 전체 할인, 결제 합계를 계산한다', () => {
    const product: Product = {
      id: 'p4',
      brand: 'Loopers',
      name: '할인 테스트 상품',
      category: 'fashion',
      price: 138_000,
      originalPrice: 158_000,
      image: '/p4.jpg',
      freeShipping: true,
      sizes: [],
      rating: 5,
      reviewCount: 1,
      createdAt: '2026-08-30T00:00:00.000Z',
    };
    const secondProduct: Product = {
      ...product,
      id: 'p7',
      name: '두 번째 할인 상품',
      price: 460_000,
      originalPrice: 498_000,
    };

    expect(
      getProductPriceSummary(
        [
          { productId: 'p4', quantity: 2 },
          { productId: 'p7', quantity: 1 },
        ],
        new Map([
          ['p4', product],
          ['p7', secondProduct],
        ]),
      ),
    ).toEqual({
      originalTotal: 814_000,
      discountTotal: 78_000,
      paymentTotal: 736_000,
    });
  });

  it('상품 정보가 없는 항목은 합계에 포함하지 않는다', () => {
    expect(
      getProductPriceSummary(
        [{ productId: 'missing', quantity: 2 }],
        new Map(),
      ),
    ).toEqual({
      originalTotal: 0,
      discountTotal: 0,
      paymentTotal: 0,
    });
  });
});
