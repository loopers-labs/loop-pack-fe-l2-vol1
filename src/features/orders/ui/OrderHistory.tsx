"use client";

import { useOrders } from "@/features/orders/api/queries";

import styles from "./OrderHistory.module.css";

export function OrderHistory() {
  const orders = useOrders();

  if (orders.isPending) {
    return <p className={styles.message}>주문 내역을 불러오는 중…</p>;
  }
  if (orders.isError) {
    return (
      <p role="alert" className={styles.message}>
        {orders.error?.message}
      </p>
    );
  }
  if (orders.data.length === 0) {
    // 주문 직후 무효화로 재조회 중이면 아직 stale 빈 배열이라, "없음" 대신 로딩을 보여 깜빡임을 막는다.
    if (orders.isFetching) {
      return <p className={styles.message}>주문 내역을 불러오는 중…</p>;
    }
    return <p className={styles.message}>주문 내역이 없습니다.</p>;
  }

  return (
    <ul className={styles.list}>
      {orders.data.map((order) => (
        <li key={order.id} className={styles.order}>
          <div className={styles.head}>
            <span className={styles.id}>{order.id}</span>
            <time dateTime={order.createdAt} className={styles.date}>
              {new Date(order.createdAt).toLocaleString("ko-KR")}
            </time>
          </div>
          <ul className={styles.items}>
            {order.items.map((item) => (
              <li key={item.productId}>
                {item.productId} × {item.quantity}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
