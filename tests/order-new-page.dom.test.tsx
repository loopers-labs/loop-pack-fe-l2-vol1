import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OrderNewPage } from '@/_pages/order-new';
import { useCartStore } from '@/entities/cart/model/cart-store';
import {
  orderQueries,
  type CheckoutDraftItem,
  type OrderCreateRequest,
  type OrderCreateResponse,
} from '@/entities/order';
import { useCheckoutStore } from '@/entities/order/model/checkout-store';
import { PRODUCTS, SESSION_USER } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';
import { renderWithProviders } from '@tests/render-with-providers';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

afterEach(() => {
  vi.clearAllMocks();
});

const productAt = (index: number) => {
  const product = PRODUCTS.at(index);

  if (!product) throw new Error(`픽스처에 ${index}번째 상품이 없다`);

  return product;
};

const seedDraft = (...draftItems: CheckoutDraftItem[]) =>
  useCheckoutStore.setState({ draftItems });

const seedCartItems = (
  ...items: { productId: string; quantity: number; checked: boolean }[]
) => useCartStore.setState({ items });

const renderOrderNewPage = () =>
  renderWithProviders(<OrderNewPage />, { initialUser: SESSION_USER });

/** 주문 API 계약을 검사하며 성공을 돌려주는 핸들러. 받은 body를 기록한다. */
const succeedOrderCreate = () => {
  const requests: OrderCreateRequest[] = [];

  server.use(
    http.post('*/api/orders', async ({ request }) => {
      const body = (await request.json()) as OrderCreateRequest;
      // 로그인 핸들러처럼 요청 계약을 검사한다. 직렬화가 깨진 주문이 성공하면 안 된다.
      const isValidRequest =
        Array.isArray(body.items) &&
        body.items.length > 0 &&
        body.items.every(
          (item) =>
            PRODUCTS.some((product) => product.id === item.productId) &&
            Number.isSafeInteger(item.quantity) &&
            item.quantity >= 1,
        );

      if (!isValidRequest) {
        return HttpResponse.json(
          { message: '요청 조건을 확인해주세요.' },
          { status: 400 },
        );
      }

      requests.push(body);

      return HttpResponse.json<OrderCreateResponse>(
        {
          order: {
            id: 'order-1',
            createdAt: '2026-08-31T00:00:00.000Z',
            items: body.items,
          },
        },
        { status: 201 },
      );
    }),
  );

  return requests;
};

describe('주문서 구성', () => {
  it('복원 후 draft가 없으면 빈 상태와 장바구니 CTA를 보여준다', async () => {
    renderOrderNewPage();

    expect(
      await screen.findByText('주문할 상품이 없습니다'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '장바구니로 이동' }),
    ).toHaveAttribute('href', '/cart');
  });

  it('draft를 catalog와 대조해 판매 중인 상품들의 수량·합산 금액만 보여준다', async () => {
    const [firstProduct, secondProduct] = [productAt(0), productAt(1)];

    seedDraft(
      { productId: firstProduct.id, quantity: 2 },
      { productId: secondProduct.id, quantity: 3 },
      { productId: 'ghost-1', quantity: 1 },
    );
    renderOrderNewPage();

    expect(await screen.findByText(firstProduct.name)).toBeInTheDocument();
    expect(screen.getByText(secondProduct.name)).toBeInTheDocument();
    expect(screen.getByText('2개')).toBeInTheDocument();
    expect(screen.getByText('3개')).toBeInTheDocument();
    expect(
      screen.getByText(`${(firstProduct.price * 2).toLocaleString()}원`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${(secondProduct.price * 3).toLocaleString()}원`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${(firstProduct.price * 2 + secondProduct.price * 3).toLocaleString()}원`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ghost-1/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '장바구니로 돌아가기' }),
    ).toHaveAttribute('href', '/cart');
  });

  it('draft 상품이 모두 catalog에 없으면 빈 상태를 보여준다', async () => {
    seedDraft({ productId: 'ghost-1', quantity: 1 });
    renderOrderNewPage();

    expect(
      await screen.findByText('주문할 상품이 없습니다'),
    ).toBeInTheDocument();
  });
});

describe('주문 생성', () => {
  it('성공하면 주문한 상품만 장바구니에서 빼고 draft를 비운 뒤 주문 내역으로 간다', async () => {
    const orderedProduct = productAt(0);
    const remainingProduct = productAt(1);
    const requests = succeedOrderCreate();

    seedCartItems(
      { productId: orderedProduct.id, quantity: 2, checked: true },
      { productId: remainingProduct.id, quantity: 1, checked: false },
    );
    seedDraft({ productId: orderedProduct.id, quantity: 2 });

    const { user, queryClient } = renderOrderNewPage();

    queryClient.setQueryData(orderQueries.all(), []);

    await user.click(await screen.findByRole('button', { name: '주문하기' }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/orders');
    });
    expect(requests).toEqual([
      { items: [{ productId: orderedProduct.id, quantity: 2 }] },
    ]);
    expect(useCartStore.getState().items).toEqual([
      { productId: remainingProduct.id, quantity: 1, checked: false },
    ]);
    expect(useCheckoutStore.getState().draftItems).toEqual([]);
    // 주문 내역이 새 주문을 다시 조회하도록 캐시를 무효화한다
    expect(queryClient.getQueryState(orderQueries.all())?.isInvalidated).toBe(
      true,
    );
  });

  it('실패하면 오류를 보여주고 장바구니와 draft를 유지해 다시 시도할 수 있다', async () => {
    server.use(
      http.post('*/api/orders', () =>
        HttpResponse.json(
          { message: '주문을 처리하지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );
    seedCartItems({ productId: productAt(0).id, quantity: 2, checked: true });
    seedDraft({ productId: productAt(0).id, quantity: 2 });

    const { user } = renderOrderNewPage();

    await user.click(await screen.findByRole('button', { name: '주문하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '주문을 처리하지 못했습니다.',
    );
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCheckoutStore.getState().draftItems).toEqual([
      { productId: productAt(0).id, quantity: 2 },
    ]);
    expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('요청 중에는 주문하기를 비활성화해 중복 주문을 막는다', async () => {
    const { promise: responseAllowed, resolve: allowResponse } =
      Promise.withResolvers<void>();

    server.use(
      http.post('*/api/orders', async ({ request }) => {
        const body = (await request.json()) as OrderCreateRequest;

        await responseAllowed;

        return HttpResponse.json<OrderCreateResponse>(
          {
            order: {
              id: 'order-1',
              createdAt: '2026-08-31T00:00:00.000Z',
              items: body.items,
            },
          },
          { status: 201 },
        );
      }),
    );
    seedCartItems({ productId: productAt(0).id, quantity: 1, checked: true });
    seedDraft({ productId: productAt(0).id, quantity: 1 });

    const { user } = renderOrderNewPage();

    await user.click(await screen.findByRole('button', { name: '주문하기' }));

    expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled();

    allowResponse();

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/orders');
    });
  });
});
