import type { Metadata } from "next";
import { OrdersPage } from "@/_pages/orders";
import { requireServerSession } from "@/app/_lib/session";

export const metadata: Metadata = {
  title: "주문 내역",
  robots: { index: false },
};

// 주문 데이터는 클라이언트에서 가져온다. mock 주문 저장소가 Route Handler 프로세스 메모리에만 있어
// 서버 컴포넌트에서 직접 호출하면 다른 번들의 빈 Map 을 보게 되고, HTTP 로 우회하면 쿠키 전달 + 500ms 지연이
// 스트리밍 앞에 붙는다. 이 화면은 검색 노출이 필요 없는 개인 데이터라 서버 prefetch 의 이점도 없다
export default async function OrdersRoute() {
  await requireServerSession("/orders");

  return <OrdersPage />;
}
