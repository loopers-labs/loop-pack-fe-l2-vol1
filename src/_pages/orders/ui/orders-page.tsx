"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { orderQueries } from "@/entities/order";
import { indexProductsById, productCatalogQueries } from "@/entities/product";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";
import type { Order } from "@/types/auth";
import type { Product } from "@/types/commerce";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

const orderTotal = (order: Order, catalog: Map<string, Product>) =>
  order.items.reduce(
    (sum, item) => sum + (catalog.get(item.productId)?.price ?? 0) * item.quantity,
    0,
  );

export function OrdersPage() {
  const orders = useQuery(orderQueries.list());
  const products = useQuery(productCatalogQueries.all());

  if (orders.isPending) {
    return (
      <section className="week05-section" aria-busy="true" aria-label="주문 내역 불러오는 중">
        <h1>주문 내역</h1>
        <p>주문 내역을 불러오는 중…</p>
      </section>
    );
  }

  if (orders.isError) {
    // 401 은 SessionBoundary 가 로그인으로 보내므로 여기 남는 에러는 그 외의 것이다
    return (
      <section className="week05-section">
        <h1>주문 내역</h1>
        <Placeholder
          role="alert"
          title="주문 내역을 불러오지 못했어요"
          description={
            orders.error instanceof CommerceApiError
              ? orders.error.message
              : "잠시 후 다시 시도해 주세요."
          }
          action={
            <button type="button" onClick={() => orders.refetch()}>
              다시 시도
            </button>
          }
        />
      </section>
    );
  }

  if (orders.data.length === 0) {
    return (
      <section className="week05-section" aria-labelledby="orders-title">
        <h1 id="orders-title">주문 내역</h1>
        <Placeholder
          title="아직 주문한 상품이 없어요"
          description="상품을 담고 주문서에서 주문을 완료하면 여기에 쌓여요."
          action={<Link href="/products">상품 보러 가기</Link>}
        />
      </section>
    );
  }

  const catalog = indexProductsById(products.data ?? []);

  return (
    <section className="week05-section week09-narrow" aria-labelledby="orders-title">
      <h1 id="orders-title">주문 내역</h1>
      <p>총 {orders.data.length}건</p>
      <ul className="week09-orders" aria-label="주문 목록">
        {[...orders.data].reverse().map((order) => (
          <li key={order.id}>
            <article aria-label={`주문 ${order.id}`}>
              <header>
                <strong>주문 {order.id}</strong>
                <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
              </header>
              <ul className="week09-lines">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    <span>{catalog.get(item.productId)?.name ?? item.productId}</span>
                    <span>수량 {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <p className="week09-total">
                합계 <strong>{orderTotal(order, catalog).toLocaleString()}원</strong>
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
