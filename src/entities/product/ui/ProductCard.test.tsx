import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductCard } from './ProductCard';
import type { Product } from '@/entities/product/model/product';

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

/* AI-generated : week06-fsd.md 3단계 기준 — 순수 상품 표현 + children 슬롯만 검증. 찜/담기 행위 검증은 widgets/product-list-section/ui/ProductListSection.test.tsx로 이관(4단계) */
describe('ProductCard', () => {
  it('브랜드·상품명·가격을 표시한다', () => {
    render(<ProductCard product={PRODUCT} />);

    expect(screen.getByText('Loopers Select')).toBeTruthy();
    expect(screen.getByText('테스트 상품')).toBeTruthy();
    expect(screen.getByText('10,000원')).toBeTruthy();
  });

  it('찜/담기 같은 행위 없이도 렌더링된다 (children은 선택)', () => {
    render(<ProductCard product={PRODUCT} />);

    expect(screen.getByText('테스트 상품')).toBeTruthy();
  });

  it('children으로 넘긴 행위 버튼을 그린다', () => {
    render(
      <ProductCard product={PRODUCT}>
        <button type="button">찜</button>
      </ProductCard>,
    );

    expect(screen.getByRole('button', { name: '찜' })).toBeTruthy();
  });
});
