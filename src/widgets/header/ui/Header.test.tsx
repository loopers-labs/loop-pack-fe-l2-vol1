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

  // Week 08 Step 2 보강 — 장바구니/위시리스트 개수 파생 경계: 빈 store
  it('위시리스트/장바구니가 비어있으면 0을 보여준다', () => {
    renderHeader();

    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
  });

  // Week 08 Step 2 보강 — 장바구니/위시리스트 개수 파생 정상: 서로 다른 저장 개수
  it('store에 위시리스트 2개와 장바구니 1개가 있으면 Header에 각각 같은 개수를 보여준다', () => {
    useWishlistStore.setState({ productIds: new Set(['p1', 'p2']) });
    useCartStore.setState({ productIds: new Set(['p1']) });
    renderHeader();

    expect(screen.getByText('위시리스트 2')).toBeInTheDocument();
    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
  });
});
