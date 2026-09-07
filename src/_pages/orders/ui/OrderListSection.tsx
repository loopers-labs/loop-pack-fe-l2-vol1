"use client";

import { useQuery } from "@tanstack/react-query";
import { orderQueries } from "../api/orderQueries";
import layout from "@/shared/ui/layout.module.css";
import styles from "./OrderListSection.module.css";

export function OrderListSection() {
  // 접근 가드는 proxy(서버)가 렌더 전에 담당하므로 이 화면은 인증됨을 전제한다.
  const { data, isPending } = useQuery(orderQueries.list());

  if (isPending) {
    return <p className={layout.status}>불러오는 중…</p>;
  }

  if (data === undefined || data.orders.length === 0) {
    return <p className={layout.status}>아직 주문이 없습니다.</p>;
  }

  return (
    <ul className={styles.orderList}>
      {data.orders.map((order) => (
        <li key={order.id} className={styles.orderItem}>
          <p className={styles.orderDate}>
            {new Date(order.createdAt).toLocaleString("ko-KR")}
          </p>
          <ul className={styles.lineItems}>
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
