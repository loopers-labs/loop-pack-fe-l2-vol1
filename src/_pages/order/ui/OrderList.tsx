'use client';

// [AI] 보호 경로 화면(/orders)의 최소 구현. GET /api/orders로 주문 내역을 보여준다.
// week-09 1단계: 미로그인(401)은 화면에서 안내만 하고, 진입 자체를 막는 가드는
// 1-3의 proxy.ts가 담당한다. 주문 API 응답에는 금액이 없으므로 상품 id와 수량만 노출한다.
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/fetcher';
import { Header } from '@/widgets/header/Header';
import { orderQueries } from '@/entities/order/api/queries';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const OrderList = () => {
  const { data, isPending, isError, error, refetch } = useQuery(orderQueries.list());

  const renderBody = () => {
    if (isPending) {
      return <p>불러오는 중...</p>;
    }

    if (isError) {
      // 401은 "로그인 안 함"과 "세션 만료"가 섞여 온다. 만료 안내 흐름은 1-4에서
      // 정한 한 곳의 처리 위치로 옮겨갈 예정이라 여기서는 최소 안내만 한다.
      if (error instanceof ApiError && error.status === 401) {
        return <p role="alert">로그인이 필요한 화면입니다. 로그인 후 다시 확인해 주세요.</p>;
      }
      // 5xx는 queryClient throwOnError로 error boundary가 담당하므로 여기는 4xx/네트워크.
      const message =
        error instanceof ApiError ? error.message : '주문 내역을 불러오지 못했습니다.';
      return (
        <p role="alert">
          {message}{' '}
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        </p>
      );
    }

    if (data.orders.length === 0) {
      return <p>아직 주문 내역이 없습니다.</p>;
    }

    return (
      <ul>
        {data.orders.map((order) => (
          <li key={order.id}>
            <p>
              주문번호 {order.id} · {formatDate(order.createdAt)}
            </p>
            <ul>
              {order.items.map((item) => (
                <li key={item.productId}>
                  상품 {item.productId} × {item.quantity}개
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="page">
      <Header />
      <section className="section">
        <h1>주문 내역</h1>
        {renderBody()}
      </section>
    </main>
  );
};
