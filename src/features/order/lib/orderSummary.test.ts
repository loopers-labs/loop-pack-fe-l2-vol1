import { describe, expect, it } from 'vitest';
import type { OrderItem } from '@/entities/order/model/types';
import type { Product } from '@/entities/product/model/types';
import {
  getOrderItemCount,
  getOrderTotal,
} from './orderSummary';

const items: OrderItem[] = [
  { productId: 'p1', quantity: 2 },
  { productId: 'p2', quantity: 1 },
];

const products = new Map<string, Product>([
  [
    'p1',
    {
      id: 'p1',
      brand: 'Loopers',
      name: '첫 번째 상품',
      category: 'casual',
      price: 10_000,
      originalPrice: 12_000,
      image: '/p1.jpg',
      freeShipping: true,
      sizes: [],
      rating: 5,
      reviewCount: 1,
      createdAt: '2026-08-30T00:00:00.000Z',
    },
  ],
  [
    'p2',
    {
      id: 'p2',
      brand: 'Loopers',
      name: '두 번째 상품',
      category: 'fashion',
      price: 5_000,
      originalPrice: null,
      image: '/p2.jpg',
      freeShipping: false,
      sizes: [],
      rating: 4,
      reviewCount: 1,
      createdAt: '2026-08-30T00:00:00.000Z',
    },
  ],
]);

describe('orderSummary', () => {
  it('장바구니 수량으로 전체 주문 상품 수를 계산한다', () => {
    expect(getOrderItemCount(items)).toBe(3);
  });

  it('상품 캐시의 현재 가격과 장바구니 수량으로 결제 금액을 계산한다', () => {
    expect(getOrderTotal(items, products)).toBe(25_000);
  });

});
