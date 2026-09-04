import type { Metadata } from "next";
import { SessionGate } from "@/features/auth";
import { OrdersPage } from "@/_pages/orders/ui/OrdersPage";

export const metadata: Metadata = { title: "주문 내역" };

// 서버 프리페치를 하지 않는다. /api/orders는 세션 쿠키를 요구하는데 서버 fetch는
// 들어온 요청의 쿠키를 자동으로 싣지 않는다. 쿠키를 손으로 옮겨 self-HTTP를 하는
// 대신 브라우저가 직접 조회한다 — 보호 경로라 proxy가 이미 걸러 준 뒤다.
export default function Page() {
  return (
    <SessionGate>
      <OrdersPage />
    </SessionGate>
  );
}
