"use client";

import { useState } from "react";

type Order = {
  id: string;
  customerId: string;
  status: string;
};

export default function DlcAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("주문 새로고침을 눌러 조회하세요.");

  const loadOrders = async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    if (!response.ok) {
      setMessage(`주문 조회 실패 (${response.status})`);
      return;
    }
    const body = (await response.json()) as { orders?: Order[] };
    setOrders(Array.isArray(body.orders) ? body.orders : []);
    setMessage("");
  };

  const markPreparing = async (orderId: string) => {
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "preparing" }),
    });
    if (!response.ok) {
      setMessage(`상태 변경 실패 (${response.status})`);
      return;
    }
    await loadOrders();
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
      <h1>DLC 운영자 주문 관리</h1>
      <p>
        이 화면은 주문 조회와 상태 변경만 제공하는 starter 골격입니다. 데이터는 admin
        Route Handler가 <code>COMMERCE_API_URL</code>로 직접 요청합니다.
      </p>
      <button type="button" onClick={() => void loadOrders()}>
        주문 새로고침
      </button>
      {message ? <p role="status">{message}</p> : null}
      <ul>
        {orders.map((order) => (
          <li key={order.id} style={{ marginBottom: 16 }}>
            <strong>{order.id}</strong> · 고객 {order.customerId} · {order.status}{" "}
            <button type="button" onClick={() => void markPreparing(order.id)}>
              준비 중으로 변경
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
