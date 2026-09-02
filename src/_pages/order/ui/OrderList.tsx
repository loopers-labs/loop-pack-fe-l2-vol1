'use client';

// [AI] 보호 경로 화면(/orders)의 최소 구현. GET /api/orders로 주문 내역을 보여준다.
// week-09 1단계: 미로그인(401)은 화면에서 안내만 하고, 진입 자체를 막는 가드는
// 1-3의 proxy.ts가 담당한다. 주문 API 응답에는 금액이 없으므로 상품 id와 수량만 노출한다.
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/fetcher';
import { Header } from '@/widgets/header/Header';
import { orderQueries } from '@/entities/order/api/queries';
import type { AuthUser } from '@/entities/auth/model';

// [AI] 서버 컴포넌트(app/orders/page.tsx)가 쿠키를 판독해 내려주는 초기 로그인 상태.
// 이 값이 헤더의 초기 HTML 렌더에 사용된다 (week-09 1-2).
type OrderListProps = {
  serverUser?: AuthUser | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const OrderList = ({ serverUser }: OrderListProps) => {
  const { data, isPending, isError, error, refetch } = useQuery(orderQueries.list());

  const renderBody = () => {
    if (isPending) {
      return <p>불러오는 중...</p>;
    }

    if (isError) {
      // [AI] 401(만료)은 전역 처리기(queryClient의 onError)가 정리 후 로그인으로 보내므로
      // 화면별 401 분기를 두지 않는다 (RFC "한 곳" 원칙). 이 분기는 그 처리 전 잠깐의 표시와
      // 4xx·네트워크 오류를 담당한다. 5xx는 throwOnError로 error boundary가 처리.
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
      <Header serverUser={serverUser} />
      <section className="section">
        <h1>주문 내역</h1>
        {renderBody()}
      </section>
    </main>
  );
};
