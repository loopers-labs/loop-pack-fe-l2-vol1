// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartStoreProvider } from '@/entities/cart/model/CartStoreProvider';
import type { ProductListResponse } from '@/entities/product/model/types';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { productListFixture } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { CartContent } from './CartContent';

function renderCart() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CartStoreProvider ownerKey="guest">
        <CartContent />
      </CartStoreProvider>
    </QueryClientProvider>,
  );
}

describe('CartContent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', undefined);
    useWishlistStore.setState({ ids: new Set(), isHydrated: true });
    server.use(
      http.get('*/api/products', ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        if (id) return HttpResponse.json(productListFixture.products[0]);
        return HttpResponse.json(productListFixture);
      }),
    );
  });

  it('빈 장바구니 안내와 상품 목록 링크 다음에 전체상품 피드를 보여준다', async () => {
    renderCart();

    expect(
      await screen.findByRole('heading', {
        name: '장바구니에 담긴 상품이 없어요.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('원하는 상품을 담아보세요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '상품 담으러 가기' })).toHaveAttribute(
      'href',
      '/products',
    );
    expect(
      screen.getByRole('heading', { name: '전체상품' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: productListFixture.products[0].name,
      }),
    ).toBeInTheDocument();
  });

  it('피드에서 상품을 담으면 장바구니 상품 화면으로 전환한다', async () => {
    const user = userEvent.setup();
    const product = productListFixture.products[0];
    renderCart();

    await user.click(
      await screen.findByRole('button', {
        name: `${product.name} 장바구니에 담기`,
      }),
    );

    expect(
      await screen.findByRole('heading', { name: '장바구니' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('원하는 상품을 담아보세요.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '주문하기' })).toHaveAttribute(
      'href',
      '/orders/new',
    );
  });

  it('할인 상품의 가격 정보와 전체 할인액을 장바구니에 표시한다', async () => {
    const discountedProduct = {
      ...productListFixture.products[0],
      id: 'discounted-product',
      name: '할인 테스트 상품',
      price: 138_000,
      originalPrice: 158_000,
    };
    const discountedResponse: ProductListResponse = {
      ...productListFixture,
      products: [discountedProduct],
    };

    server.use(
      http.get('*/api/products', ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        if (id) return HttpResponse.json(discountedProduct);
        return HttpResponse.json(discountedResponse);
      }),
    );
    const user = userEvent.setup();
    renderCart();

    await user.click(
      await screen.findByRole('button', {
        name: `${discountedProduct.name} 장바구니에 담기`,
      }),
    );

    const itemRow = await screen.findByRole('listitem');
    const paymentSummary = screen.getByRole('complementary');

    expect(within(itemRow).getByText('13%')).toBeInTheDocument();
    expect(within(itemRow).getAllByText('138,000원')).toHaveLength(2);
    expect(within(itemRow).getByText('158,000원')).toBeInTheDocument();
    expect(
      within(itemRow).getByText('할인 금액 -20,000원'),
    ).toBeInTheDocument();
    expect(within(paymentSummary).getByText('총 상품 금액')).toBeInTheDocument();
    expect(within(paymentSummary).getByText('158,000원')).toBeInTheDocument();
    expect(within(paymentSummary).getByText('할인 금액')).toBeInTheDocument();
    expect(within(paymentSummary).getByText('-20,000원')).toBeInTheDocument();
    expect(
      within(paymentSummary).getByText('최종 결제 금액'),
    ).toBeInTheDocument();
    expect(within(paymentSummary).getByText('138,000원')).toBeInTheDocument();
  });

});
