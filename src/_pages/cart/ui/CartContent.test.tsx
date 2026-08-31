// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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

  it('다음 페이지를 불러와 기존 상품 아래에 누적한다', async () => {
    const firstProduct = productListFixture.products[0];
    const secondProduct = {
      ...firstProduct,
      id: 'test-product-2',
      name: '두 번째 테스트 상품',
    };

    server.use(
      http.get('*/api/products', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        const response: ProductListResponse = {
          ...productListFixture,
          products: page === 2 ? [secondProduct] : [firstProduct],
          page,
          pageSize: 1,
          totalCount: 2,
        };
        return HttpResponse.json(response);
      }),
    );
    const user = userEvent.setup();
    renderCart();

    await screen.findByRole('heading', { name: firstProduct.name });
    await user.click(screen.getByRole('button', { name: '더 보기' }));

    expect(
      await screen.findByRole('heading', { name: secondProduct.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: firstProduct.name }),
    ).toBeInTheDocument();
    expect(screen.getByText('모든 상품을 확인했어요.')).toBeInTheDocument();
  });

  it('다음 페이지가 실패해도 기존 상품을 유지하고 재시도한다', async () => {
    const firstProduct = productListFixture.products[0];
    const recoveredProduct = {
      ...firstProduct,
      id: 'recovered-product',
      name: '재시도로 불러온 상품',
    };
    let secondPageRequests = 0;

    server.use(
      http.get('*/api/products', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (page === 2) {
          secondPageRequests += 1;
          if (secondPageRequests === 1) {
            return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
          }
        }

        const response: ProductListResponse = {
          ...productListFixture,
          products: page === 2 ? [recoveredProduct] : [firstProduct],
          page,
          pageSize: 1,
          totalCount: 2,
        };
        return HttpResponse.json(response);
      }),
    );
    const user = userEvent.setup();
    renderCart();

    await screen.findByRole('heading', { name: firstProduct.name });
    await user.click(screen.getByRole('button', { name: '더 보기' }));

    expect(
      await screen.findByText('다음 상품을 불러오지 못했어요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: firstProduct.name }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(
      await screen.findByRole('heading', { name: recoveredProduct.name }),
    ).toBeInTheDocument();
    expect(secondPageRequests).toBe(2);
  });
});
