import { useCartStore } from '@/entities/cart';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { Header } from '@/widgets/header';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { OrderPage } from './OrderPage';

/**
 * 주문서 (통합)
 *
 * 담아둔 것을 주문으로 바꾸는 화면이라, 보는 것은 **화면에 무엇이 보이는가** 와
 * **어떤 주문이 서버로 나가는가** 다.
 *
 * 성공 케이스만 Header 를 함께 렌더한다. 주문 뒤 장바구니가 비워졌다는 것은 완료 화면에
 * 드러나지 않고 헤더 개수로만 보이기 때문이다.
 */
const orderSucceeds = () => {
  const bodies: unknown[] = [];

  server.use(
    http.post('/api/orders', async ({ request }) => {
      bodies.push(await request.json());

      return HttpResponse.json(
        { order: { id: 'o7', createdAt: '2026-09-01T00:00:00.000Z', items: [] } },
        { status: 201 },
      );
    }),
  );

  return bodies;
};

const orderFails = () =>
  server.use(
    http.post('/api/orders', () => HttpResponse.json({ message: '주문 정보를 처리하지 못했습니다.' }, { status: 500 })),
  );

const clickOrder = () => userEvent.setup().click(screen.getByRole('button', { name: '주문하기' }));

describe('주문서', () => {
  it('담아둔 것이 없으면 주문할 것이 없다고 알린다', () => {
    renderWithProviders(<OrderPage />);

    expect(screen.getByText('장바구니가 비어 있습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '주문하기' })).not.toBeInTheDocument();
  });

  it('담아둔 상품과 종 수를 보여준다', () => {
    useCartStore.setState({ cart: ['p1', 'p2'] });

    renderWithProviders(<OrderPage />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('총 2종')).toBeInTheDocument();
  });

  describe('사용자가 주문했을 때', () => {
    it('담아둔 상품을 수량 1 로 서버에 보낸다', async () => {
      useCartStore.setState({ cart: ['p1', 'p2'] });
      const bodies = orderSucceeds();

      renderWithProviders(<OrderPage />);
      await clickOrder();

      expect(bodies).toEqual([
        {
          items: [
            { productId: 'p1', quantity: 1 },
            { productId: 'p2', quantity: 1 },
          ],
        },
      ]);
    });

    it('주문 완료와 주문번호를 보여주고 담아둔 것을 비운다', async () => {
      useCartStore.setState({ cart: ['p1', 'p2'] });
      orderSucceeds();

      renderWithProviders(
        <>
          <Header />
          <OrderPage />
        </>,
      );
      expect(within(screen.getByRole('banner')).getByText('장바구니 2')).toBeInTheDocument();

      await clickOrder();

      expect(await screen.findByRole('heading', { name: '주문 완료' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('주문번호 o7');
      expect(within(screen.getByRole('banner')).getByText('장바구니 0')).toBeInTheDocument();
    });

    // 응답을 기다리는 동안 다시 누르면 주문이 두 건 들어간다
    it('응답을 기다리는 동안에는 다시 주문할 수 없다', async () => {
      useCartStore.setState({ cart: ['p1'] });
      server.use(http.post('/api/orders', () => delay('infinite')));

      renderWithProviders(<OrderPage />);
      await clickOrder();

      expect(screen.getByRole('button', { name: '주문 중…' })).toBeDisabled();
    });
  });

  describe('주문에 실패했을 때', () => {
    it('서버가 준 사유를 보여주고 담아둔 것을 그대로 남긴다', async () => {
      useCartStore.setState({ cart: ['p1'] });
      orderFails();

      renderWithProviders(<OrderPage />);
      await clickOrder();

      expect(await screen.findByRole('alert')).toHaveTextContent('주문 정보를 처리하지 못했습니다.');
      expect(screen.getByText('총 1종')).toBeInTheDocument();
    });
  });
});
