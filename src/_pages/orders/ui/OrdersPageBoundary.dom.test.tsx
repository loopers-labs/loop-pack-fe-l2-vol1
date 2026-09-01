import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { OrderListResponse } from '../model/types';
import { OrdersPageBoundary } from './OrdersPageBoundary';

/**
 * 주문 내역 화면 (통합)
 *
 * Boundary 를 통째로 렌더해 사용자가 실제로 보는 것을 단언한다.
 * 로딩·에러를 컴포넌트 안에서 분기하지 않고 Suspense·ErrorBoundary 로 올린 결정이
 * 화면으로 지켜지는지가 여기서 확인된다.
 *
 * 세션 만료(401)는 여기 없다. 그 결과는 로그인 화면으로의 전체 페이지 이동이라
 * jsdom 에서는 화면이 만들어지지 않는다 — 4단계 E2E(expired 시나리오) 몫이다.
 * 이 파일이 지키는 것은 "만료가 아닌 실패"의 화면이다.
 *
 * 첫 대기만 findBy* 로 하고 나머지는 동기로 확인한다.
 */
const ordersRespond = (orders: OrderListResponse['orders']) =>
  server.use(http.get('/api/orders', () => HttpResponse.json<OrderListResponse>({ orders })));

const ordersFail = () =>
  server.use(http.get('/api/orders', () => HttpResponse.json({ message: '서버 오류' }, { status: 500 })));

/** 주문 번호와 품목 수를 갈라 둔다. 모든 행이 첫 주문을 그리는 버그를 개수 단언만으로는 못 잡는다. */
const anOrder = (id: string, itemCount = 1) => ({
  id,
  createdAt: '2026-08-31T09:00:00.000Z',
  items: Array.from({ length: itemCount }, (_, index) => ({ productId: `p${index + 1}`, quantity: 1 })),
});

describe('주문 내역 화면', () => {
  it('조회하는 동안 기다리는 중임을 알리고, 받아오면 받은 주문을 그대로 보여준다', async () => {
    ordersRespond([anOrder('o1', 1), anOrder('o2', 3)]);

    renderWithProviders(<OrdersPageBoundary />);

    expect(screen.getByText('주문 내역을 불러오는 중입니다…')).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: '주문 내역' })).toBeInTheDocument();

    const rows = screen.getAllByRole('listitem');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('주문 o1');
    expect(rows[0]).toHaveTextContent('1종');
    expect(rows[1]).toHaveTextContent('주문 o2');
    expect(rows[1]).toHaveTextContent('3종');
    expect(screen.queryByText('주문 내역을 불러오는 중입니다…')).not.toBeInTheDocument();
  });

  // 경계 — 주문이 없는 것은 실패가 아니다. 빈 목록에 에러 화면을 띄우지 않는다
  it('주문이 하나도 없으면 실패가 아니라 비어 있다고 알린다', async () => {
    ordersRespond([]);

    renderWithProviders(<OrdersPageBoundary />);

    expect(await screen.findByText('주문 내역이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('조회에 실패하면', () => {
    it('실패했음을 알리고 다시 시도할 수단을 준다', async () => {
      ordersFail();

      renderWithProviders(<OrdersPageBoundary />);

      expect(await screen.findByRole('alert')).toHaveTextContent('주문 내역을 불러오지 못했습니다.');
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    });

    // 다시 시도가 실제로 재조회로 이어지는지 — reset 을 ErrorBoundary 에 연결한 이유가 이것이다
    it('다시 시도를 누르면 재조회해서 성공 화면으로 돌아온다', async () => {
      ordersFail();

      renderWithProviders(<OrdersPageBoundary />);

      const retry = await screen.findByRole('button', { name: '다시 시도' });

      ordersRespond([anOrder('o1')]);
      await userEvent.setup().click(retry);

      expect(await screen.findByRole('heading', { name: '주문 내역' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
