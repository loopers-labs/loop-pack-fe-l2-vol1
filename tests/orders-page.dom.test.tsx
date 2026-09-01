import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { OrdersPage } from '@/_pages/orders';
import { orderQueries, type OrderListResponse } from '@/entities/order';
import { PRODUCTS, SESSION_USER } from '@tests/msw/fixtures';
import { productListResponse } from '@tests/msw/handlers';
import { server } from '@tests/msw/server';
import { renderWithProviders } from '@tests/render-with-providers';

const productAt = (index: number) => {
  const product = PRODUCTS.at(index);

  if (!product) throw new Error(`픽스처에 ${index}번째 상품이 없다`);

  return product;
};

const respondOrders = (orders: OrderListResponse['orders']) =>
  server.use(
    http.get('*/api/orders', () =>
      HttpResponse.json<OrderListResponse>({ orders }),
    ),
  );

const renderOrdersPage = () =>
  renderWithProviders(<OrdersPage />, { initialUser: SESSION_USER });

describe('주문 내역', () => {
  it('주문 ID·시각·수량과 catalog 상품 정보를 표시하되 현재 가격은 표시하지 않는다', async () => {
    const knownProduct = productAt(0);

    respondOrders([
      {
        id: 'order-7',
        createdAt: '2026-08-30T09:00:00.000Z',
        items: [
          { productId: knownProduct.id, quantity: 2 },
          { productId: 'ghost-1', quantity: 1 },
        ],
      },
    ]);
    renderOrdersPage();

    const order = await screen.findByRole('listitem', {
      name: '주문 order-7',
    });

    // 화면에 표시된 주문 ID·시각을 단언한다 (시각은 구현과 같은 로케일 포맷으로 비교)
    expect(within(order).getByText('주문 order-7')).toBeInTheDocument();
    expect(
      within(order).getByText(
        new Date('2026-08-30T09:00:00.000Z').toLocaleString('ko-KR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ),
    ).toBeInTheDocument();
    expect(
      await within(order).findByText(knownProduct.name),
    ).toBeInTheDocument();
    expect(within(order).getByText('2개')).toBeInTheDocument();
    // catalog에서 빠진 상품도 주문 기록이므로 ID로나마 표시한다
    expect(within(order).getByText('ghost-1')).toBeInTheDocument();
    expect(within(order).getByText('1개')).toBeInTheDocument();
    expect(
      within(order).queryByText(
        new RegExp(knownProduct.price.toLocaleString()),
      ),
    ).not.toBeInTheDocument();
    expect(within(order).queryByText(/원/)).not.toBeInTheDocument();
  });

  it('주문이 없으면 빈 상태와 상품 목록 CTA를 보여준다', async () => {
    respondOrders([]);
    renderOrdersPage();

    expect(
      await screen.findByText('주문 내역이 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '상품 보러 가기' }),
    ).toHaveAttribute('href', '/products');
  });

  it('상품 정보를 불러오는 동안에는 상품 ID를 노출하지 않고 대기한다', async () => {
    const knownProduct = productAt(0);
    const { promise: responseAllowed, resolve: allowResponse } =
      Promise.withResolvers<void>();

    respondOrders([
      {
        id: 'order-7',
        createdAt: '2026-08-30T09:00:00.000Z',
        items: [{ productId: knownProduct.id, quantity: 2 }],
      },
    ]);
    server.use(
      http.get('*/api/products', async ({ request }) => {
        await responseAllowed;

        return HttpResponse.json(
          productListResponse(new URL(request.url).searchParams),
        );
      }),
    );
    const { queryClient } = renderOrdersPage();

    // 동기화 지점: 주문 응답이 캐시에 반영된 뒤에도 catalog 전이면 여전히 대기해야 한다
    await waitFor(() => {
      expect(
        queryClient.getQueryData(orderQueries.list(SESSION_USER.id).queryKey),
      ).toEqual({
        orders: [
          {
            id: 'order-7',
            createdAt: '2026-08-30T09:00:00.000Z',
            items: [{ productId: knownProduct.id, quantity: 2 }],
          },
        ],
      });
    });
    expect(screen.getByText('주문 내역을 불러오는 중')).toBeInTheDocument();
    expect(screen.queryByText(knownProduct.id)).not.toBeInTheDocument();

    allowResponse();

    expect(await screen.findByText(knownProduct.name)).toBeInTheDocument();
  });

  it('상품 정보 조회가 실패하면 안내하고, 다시 시도로 상품명을 복구한다', async () => {
    respondOrders([
      {
        id: 'order-8',
        createdAt: '2026-08-30T09:00:00.000Z',
        items: [{ productId: productAt(0).id, quantity: 2 }],
      },
    ]);
    server.use(
      http.get(
        '*/api/products',
        () =>
          HttpResponse.json(
            { message: '상품 정보를 불러오지 못했습니다.' },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const { user } = renderOrdersPage();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('상품 정보를 불러오지 못했습니다.');
    // 안내와 함께 주문 기록은 ID로나마 남는다
    expect(screen.getByText(productAt(0).id)).toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText(productAt(0).name)).toBeInTheDocument();
  });

  it('조회가 실패하면 안내와 다시 시도를 보여주고 복구할 수 있다', async () => {
    server.use(
      http.get(
        '*/api/orders',
        () =>
          HttpResponse.json(
            { message: '주문 내역을 불러오지 못했습니다.' },
            { status: 500 },
          ),
        { once: true },
      ),
      http.get('*/api/orders', () =>
        HttpResponse.json<OrderListResponse>({
          orders: [
            {
              id: 'order-9',
              createdAt: '2026-08-30T09:00:00.000Z',
              items: [{ productId: productAt(0).id, quantity: 1 }],
            },
          ],
        }),
      ),
    );
    const { user } = renderOrdersPage();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('주문 내역을 불러오지 못했습니다.');

    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('주문 order-9')).toBeInTheDocument();
  });

  it('다른 계정으로 다시 로그인하면 이전 계정의 주문 캐시가 보이지 않는다', async () => {
    const previousUserOrders: OrderListResponse['orders'] = [
      {
        id: 'order-of-u1',
        createdAt: '2026-08-30T09:00:00.000Z',
        items: [{ productId: productAt(0).id, quantity: 1 }],
      },
    ];

    respondOrders(previousUserOrders);
    const { queryClient, unmount } = renderOrdersPage();

    expect(await screen.findByText('주문 order-of-u1')).toBeInTheDocument();

    unmount();
    // 다른 계정의 서버 응답으로 교체하고 두 번째 사용자로 다시 연다
    respondOrders([
      {
        id: 'order-of-u2',
        createdAt: '2026-08-31T09:00:00.000Z',
        items: [{ productId: productAt(1).id, quantity: 3 }],
      },
    ]);
    renderWithProviders(<OrdersPage />, {
      queryClient,
      initialUser: { id: 'u2', name: '루퍼2', email: 'looper2@loopers.dev' },
    });

    expect(screen.queryByText('주문 order-of-u1')).not.toBeInTheDocument();
    expect(await screen.findByText('주문 order-of-u2')).toBeInTheDocument();
  });
});
