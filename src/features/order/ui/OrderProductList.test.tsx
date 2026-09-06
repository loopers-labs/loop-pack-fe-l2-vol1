// @vitest-environment jsdom

import '@/test/setupDom';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Product } from '@/entities/product/model/types';
import { OrderProductList } from './OrderProductList';

const productBase: Product = {
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

describe('OrderProductList', () => {
  it('할인 상품에 할인율, 판매가, 원가와 수량이 반영된 할인 금액을 표시한다', () => {
    render(
      <OrderProductList
        items={[{ productId: productBase.id, quantity: 2 }]}
        products={new Map([[productBase.id, productBase]])}
      />,
    );

    const row = screen.getByRole('listitem');

    expect(within(row).getByText('13%')).toBeInTheDocument();
    expect(within(row).getByText('138,000원')).toBeInTheDocument();
    expect(within(row).getByText('158,000원')).toBeInTheDocument();
    expect(within(row).getByText('할인 금액 -40,000원')).toBeInTheDocument();
    expect(within(row).getByText('276,000원')).toBeInTheDocument();
  });

  it('원가가 판매가 이하인 상품에는 할인 정보를 표시하지 않는다', () => {
    const regularProduct = {
      ...productBase,
      id: 'p1',
      name: '일반 테스트 상품',
      originalPrice: productBase.price,
    };

    render(
      <OrderProductList
        items={[{ productId: regularProduct.id, quantity: 1 }]}
        products={new Map([[regularProduct.id, regularProduct]])}
      />,
    );

    const row = screen.getByRole('listitem');

    expect(within(row).queryByText(/%$/)).not.toBeInTheDocument();
    expect(within(row).queryByText(/할인 금액/)).not.toBeInTheDocument();
  });
});
