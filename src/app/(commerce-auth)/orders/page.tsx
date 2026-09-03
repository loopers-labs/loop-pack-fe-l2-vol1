import type { Metadata } from "next";
import { OrderHistoryPage } from "@/_pages/orders";

export const metadata: Metadata = {
  title: "주문 내역",
  description: "완료한 주문 내역을 확인합니다.",
};

export default function OrdersRoutePage() {
  return <OrderHistoryPage />;
}
