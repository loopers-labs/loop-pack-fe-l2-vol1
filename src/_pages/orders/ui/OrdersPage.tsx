"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ordersQueryOptions } from "@/entities/order";
import { sessionQueryOptions } from "@/entities/session";
import { products } from "@/app/api/_data/commerce";

const priceOf = (productId: string) =>
  products.find((product) => product.id === productId)?.price ?? 0;
const nameOf = (productId: string) =>
  products.find((product) => product.id === productId)?.name ?? productId;

export function OrdersPage() {
  const { data: session } = useQuery(sessionQueryOptions());
  const ordersQuery = useQuery(ordersQueryOptions());

  // 세션 만료는 QueryCache의 onError가 판정해 여기 status로 내려온다.
  // 이 화면은 판정하지 않고 결과만 그린다 — 401을 화면마다 해석하지 않는 이유다.
  if (session?.status === "expired") {
    return (
      <main className="shop-page">
        <h1>주문 내역</h1>
        <div className="shop-state" role="alert">
          <p>세션이 만료되었습니다. 다시 로그인해 주세요.</p>
          <Link href="/login?next=%2Forders">로그인</Link>
        </div>
      </main>
    );
  }

  const orders = ordersQuery.data?.orders;

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
