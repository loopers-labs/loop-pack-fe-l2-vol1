// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartStoreProvider } from '@/entities/cart/model/CartStoreProvider';
import { createCartStore } from '@/entities/cart/model/cartStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import type { Product } from '@/entities/product/model/types';
import { server } from '@/test/msw/server';
import { OrderCheckoutContent } from './OrderCheckoutContent';

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

const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

function CartQuantityProbe() {
  const totalQuantity = useCartStore((state) =>
    Array.from(state.items.values()).reduce(
      (total, item) => total + item.quantity,
      0,
    ),
  );

  return <output aria-label="장바구니 총 수량">{totalQuantity}</output>;
}

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CartStoreProvider ownerKey="guest">
        <CartQuantityProbe />
        <OrderCheckoutContent />
      </CartStoreProvider>
    </QueryClientProvider>,
  );
}

describe('OrderCheckoutContent', () => {
  beforeEach(() => {
    localStorage.clear();
    router.replace.mockReset();
  });

  it('주문에 성공하면 요청한 수량을 전송하고 장바구니를 비운 뒤 주문 내역으로 이동한다', async () => {
    const persistedStore = createCartStore('guest');
    persistedStore.getState().setHydrated();
    persistedStore.getState().addItem(product.id);
    persistedStore.getState().addItem(product.id);
    let orderRequestBody: unknown;

    server.use(
      http.get('*/api/products', ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        return id === product.id
          ? HttpResponse.json(product)
          : HttpResponse.json({ message: '상품을 찾을 수 없습니다.' }, { status: 404 });
      }),
      http.post('*/api/orders', async ({ request }) => {
        orderRequestBody = await request.json();
        return HttpResponse.json({
          order: {
            id: 'o1',
            createdAt: '2026-09-02T00:00:00.000Z',
            items: [{ productId: product.id, quantity: 2 }],
          },
        });
      }),
    );
    const user = userEvent.setup();

    renderCheckout();

    await waitFor(() =>
      expect(screen.getByLabelText('장바구니 총 수량')).toHaveTextContent('2'),
    );
    const submitButton = await screen.findByRole('button', {
      name: '276,000원 주문하기',
    });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(orderRequestBody).toEqual({
        items: [{ productId: product.id, quantity: 2 }],
      });
      expect(screen.getByLabelText('장바구니 총 수량')).toHaveTextContent('0');
      expect(router.replace).toHaveBeenCalledWith('/orders');
    });
  });
});
