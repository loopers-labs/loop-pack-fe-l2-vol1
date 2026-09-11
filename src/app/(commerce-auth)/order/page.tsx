import type { Metadata } from "next";
import { OrderPage } from "@/_pages/order";

export const metadata: Metadata = {
  title: "주문서",
  description: "장바구니 상품 주문을 진행합니다.",
};

export default function OrderRoutePage() {
  return <OrderPage />;
}
