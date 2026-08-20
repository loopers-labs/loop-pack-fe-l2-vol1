import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Header } from '@/widgets/header';
import { ProductCard } from '@/widgets/product-card';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import type { Product } from '@/entities/product/model';

const fixtureProduct: Product = {
  id: 'fx-12',
  brand: 'Fixture Brand',
  name: '테스트 담기 상품',
  category: 'home',
  price: 15000,
  originalPrice: null,
  image: '/images/fixtures/fx-12.jpg',
  freeShipping: false,
  sizes: [],
  rating: 4.0,
  reviewCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('담기 → 헤더 개수 · 다시 누르면 빠짐 (항목 12)', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
  });

  it('담기 버튼을 누르면 헤더의 장바구니 개수가 올라간다', async () => {
    render(
      <>
        <Header />
        <ProductCard product={fixtureProduct} />
      </>,
    );

    expect(screen.getByText('장바구니 0')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: '테스트 담기 상품 장바구니' }),
    );

    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
  });

  it('담긴 상태에서 다시 누르면 헤더 개수가 다시 줄어든다', async () => {
    render(
      <>
        <Header />
        <ProductCard product={fixtureProduct} />
      </>,
    );

    const cartButton = screen.getByRole('button', {
      name: '테스트 담기 상품 장바구니',
    });

    await userEvent.click(cartButton);
    expect(screen.getByText('장바구니 1')).toBeInTheDocument();

    await userEvent.click(cartButton);
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
  });
});
