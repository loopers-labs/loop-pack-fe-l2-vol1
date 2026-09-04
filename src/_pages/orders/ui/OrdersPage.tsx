"use client";
import { useQuery } from "@tanstack/react-query";
import { ordersQueryOptions } from "@/entities/order";
import { products } from "@/app/api/_data/commerce";

const priceOf = (productId: string) =>
  products.find((product) => product.id === productId)?.price ?? 0;
const nameOf = (productId: string) =>
  products.find((product) => product.id === productId)?.name ?? productId;

export function OrdersPage() {
  const ordersQuery = useQuery(ordersQueryOptions());
  const orders = ordersQuery.data?.orders;

  // 만료는 이 화면이 보지 않는다. SessionGate가 먼저 걸러서, 여기 오는 것은
  // "세션이 유효한 사용자"뿐이다(features/auth/ui/SessionGate.tsx).

  return (
    <main className="shop-page">
      <h1>주문 내역</h1>
      <section className="shop-section" aria-label="주문 목록" aria-busy={ordersQuery.isPending}>
        {ordersQuery.isPending && <p className="shop-state">주문 내역을 불러오는 중입니다…</p>}

        {ordersQuery.isError && (
          <p className="shop-state" role="alert">
            주문 내역을 불러오지 못했습니다.
          </p>
        )}

        {orders !== undefined &&
          (orders.length === 0 ? (
            <p className="shop-empty">아직 주문한 상품이 없습니다. (0개)</p>
          ) : (
            <ul className="shop-order-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <h2>주문 {order.id}</h2>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.productId}>
                        {nameOf(item.productId)} · {item.quantity}개 ·{" "}
                        {(priceOf(item.productId) * item.quantity).toLocaleString("ko-KR")}원
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </main>
  );
}
