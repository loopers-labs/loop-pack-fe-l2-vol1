// @vitest-environment jsdom

import '@/test/setupDom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartStoreProvider } from '@/entities/cart/model/CartStoreProvider';
import { productDetailQueryOptions } from '@/entities/product/api/productQueries';
import type { Product } from '@/entities/product/model/types';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { ProductDetailContent } from './ProductDetailContent';

const analytics = vi.hoisted(() => ({
  trackCartAdd: vi.fn(),
  trackProductDetailView: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'p1' }),
}));
vi.mock('@/analytics/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/analytics/events')>()),
  ...analytics,
}));

const product: Product = {
  id: 'p1',
  brand: 'Loopers',
  name: '계측 테스트 상품',
  category: 'fashion',
  price: 40_000,
  originalPrice: null,
  image: '/p1.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.8,
  reviewCount: 12,
  createdAt: '2026-09-02T00:00:00.000Z',
};

function renderProductDetail() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(productDetailQueryOptions(product.id).queryKey, product);

  return render(
    <QueryClientProvider client={queryClient}>
      <CartStoreProvider ownerKey="guest">
        <ProductDetailContent />
      </CartStoreProvider>
    </QueryClientProvider>,
  );
}

describe('ProductDetailContent analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    useWishlistStore.setState({ ids: new Set(), isHydrated: true });
    Object.values(analytics).forEach((mock) => mock.mockReset());
  });

  it('상세 진입과 장바구니 담기를 각각 한 번 계측한다', async () => {
    const user = userEvent.setup();
    renderProductDetail();

    expect(
      await screen.findByRole('heading', { name: product.name }),
    ).toBeInTheDocument();
    expect(analytics.trackProductDetailView).toHaveBeenCalledWith(product.id);

    await user.click(screen.getByRole('button', { name: '장바구니 담기' }));

    expect(analytics.trackCartAdd).toHaveBeenCalledWith(product.id);
  });
});
