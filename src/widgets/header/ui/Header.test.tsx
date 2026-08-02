import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Header } from './Header';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';

function renderHeader() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Header />
    </QueryClientProvider>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
    useCartStore.setState({ productIds: new Set() });
  });

  it('위시리스트/장바구니가 비어있으면 0을 보여준다', () => {
    renderHeader();

    expect(screen.getByText('위시리스트 0')).toBeTruthy();
    expect(screen.getByText('장바구니 0')).toBeTruthy();
  });

  it('개수를 별도로 저장하지 않고 store로부터 파생해서 보여준다', () => {
    renderHeader();

    act(() => {
      useWishlistStore.getState().setSingleIdInWishlist('p1');
      useWishlistStore.getState().setSingleIdInWishlist('p2');
      useCartStore.getState().setSingleIdInCart('p1');
    });

    expect(screen.getByText('위시리스트 2')).toBeTruthy();
    expect(screen.getByText('장바구니 1')).toBeTruthy();
  });
});
