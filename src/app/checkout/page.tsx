import type { Metadata } from "next";
import { CheckoutPage } from "@/_pages/checkout";
import { requireServerSession } from "@/app/_lib/session";

export const metadata: Metadata = {
  title: "주문서",
  robots: { index: false },
};

// 장바구니는 브라우저 메모리에만 있으므로 서버가 미리 가져올 데이터가 없다. 세션만 확인한다
export default async function CheckoutRoute() {
  await requireServerSession("/checkout");

  return <CheckoutPage />;
}
