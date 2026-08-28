// [AI] OrderList(보호 경로 화면 /orders) 통합 테스트. MSW로 성공/401/빈 응답을
// 제어해 상태 분기를 검증한다. 5xx는 queryClient의 throwOnError가 error boundary로
// 던져버려 이 컴포넌트의 분기에 도달하지 않는다 (ProductList.test.tsx와 동일 전제).
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { OrderList } from './OrderList';

// [AI] 렌더링마다 새 QueryClient를 만들어 캐시가 테스트 사이로 새는 걸 막고,
// retry: false로 덮어써 401 즉시 에러 상태로 진입하게 한다 (renderProductList와 동일 근거).
const renderOrderList = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <OrderList />
    </QueryClientProvider>
  );

afterEach(() => {
  cleanup();
});

describe('OrderList — 주문 내역 상태', () => {
  it('성공 응답이면 주문 목록과 각 주문의 상품·수량을 보여준다', async () => {
    renderOrderList();

    // [AI] JSX의 {변수} 삽입은 텍스트를 여러 조각으로 나눠 렌더링하므로
    // 정확 일치(string) 대신 정규식으로 부분 매칭한다.
    await screen.findByText(/주문번호 o1/); // 첫 대기(비동기 경계)

    expect(screen.getByText(/주문번호 o2/)).toBeInTheDocument();
    expect(screen.getByText(/상품 p1 × 2개/)).toBeInTheDocument();
    expect(screen.getByText(/상품 p3 × 1개/)).toBeInTheDocument();
    expect(screen.getByText(/상품 p2 × 1개/)).toBeInTheDocument();
  });

  it('401(로그인 필요)이면 role=alert로 로그인 안내를 보여준다', async () => {
    server.use(
      http.get('*/api/orders', () =>
        HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
      )
    );
    renderOrderList();

    const alert = await screen.findByRole('alert'); // 첫 대기(비동기 경계)

    expect(alert).toHaveTextContent('로그인이 필요한 화면입니다');
    // 401은 재시도로 해결되지 않으므로 "다시 시도" 버튼을 두지 않는다.
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('빈 주문 내역이면 "아직 주문 내역이 없습니다" 안내를 보여준다', async () => {
    server.use(http.get('*/api/orders', () => HttpResponse.json({ orders: [] })));
    renderOrderList();

    await screen.findByText('아직 주문 내역이 없습니다.'); // 첫 대기(비동기 경계)

    expect(screen.queryByText(/주문번호/)).not.toBeInTheDocument();
  });

  it('4xx 에러면 서버 메시지와 "다시 시도" 버튼을 보여준다', async () => {
    server.use(
      http.get('*/api/orders', () =>
        HttpResponse.json({ message: '요청을 처리하지 못했습니다.' }, { status: 400 })
      )
    );
    renderOrderList();

    const alert = await screen.findByRole('alert'); // 첫 대기(비동기 경계)

    expect(alert).toHaveTextContent('요청을 처리하지 못했습니다.');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });
});
