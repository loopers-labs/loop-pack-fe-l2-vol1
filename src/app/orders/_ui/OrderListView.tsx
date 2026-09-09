'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/widgets/header/ui/Header';
import { PageHeading } from '@/shared/ui/PageHeading/PageHeading';
import { QueryState } from '@/shared/ui/QueryState';
import { ErrorRetry } from '@/shared/ui/ErrorRetry/ErrorRetry';
import { formatDateTime } from '@/shared/lib/formatDateTime';
import { ordersQueryOptions } from '@/entities/order/api/ordersQueryOptions';
import { toRecentFirst } from '@/entities/order/model/order';
import type { OrderItem } from '@/entities/order/model/order';

/** 상품 열에 그대로 나열하지 않고 앞의 몇 개만 보여준다 */
const VISIBLE_PRODUCT_COUNT = 2;

/**
 * 주문 응답에는 상품 id만 있고 이름도 금액도 없다. 이름을 보여주려면 상품 데이터와
 * 조인해야 하는데, 주문 시점 이후 상품이 바뀌면 어긋나므로 id를 그대로 쓴다.
 */
function describeProducts(items: OrderItem[]): string {
  const shown = items.slice(0, VISIBLE_PRODUCT_COUNT).map((item) => item.productId);
  const hidden = items.length - shown.length;

  return hidden > 0 ? `${shown.join(', ')} 외 ${hidden}` : shown.join(', ');
}

function totalQuantity(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function OrderListView() {
  const ordersQuery = useQuery(ordersQueryOptions());

  return (
    <div className="week05-page">
      <Header />
      <main>
        <PageHeading title="주문 내역" description="지금까지 주문한 내역입니다." compact />
        <section className="week05-section" aria-label="주문 내역">
          <QueryState
            query={ordersQuery}
            renderError={(error) => (
              <ErrorRetry message={error.message} onRetry={() => ordersQuery.refetch()} />
            )}
          >
            {({ orders }) =>
              orders.length === 0 ? (
                <p>
                  아직 주문한 내역이 없습니다. <Link href="/products">상품을 둘러보세요.</Link>
                </p>
              ) : (
                // 열이 많아 좁은 화면에서 넘칠 수 있어, 페이지가 아니라 표만 가로로 스크롤한다
                <div className="week05-table-scroll">
                  <table className="week05-table">
                    {/* 표의 이름이면서 건수 정보도 함께 준다 */}
                    <caption>총 {orders.length}건</caption>
                    <thead>
                      <tr>
                        <th scope="col">주문번호</th>
                        <th scope="col">상품</th>
                        <th scope="col" className="week05-table__number">
                          수량
                        </th>
                        <th scope="col">주문일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toRecentFirst(orders).map((order) => (
                        <tr key={order.id}>
                          <th scope="row">{order.id}</th>
                          <td>{describeProducts(order.items)}</td>
                          <td className="week05-table__number">{totalQuantity(order.items)}</td>
                          <td>
                            {/* 기계가 읽을 값은 dateTime에 원문 그대로 남긴다 */}
                            <time dateTime={order.createdAt}>
                              {formatDateTime(order.createdAt)}
                            </time>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </QueryState>
        </section>
      </main>
    </div>
  );
}
