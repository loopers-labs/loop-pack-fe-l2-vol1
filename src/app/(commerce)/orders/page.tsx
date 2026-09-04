import type { Metadata } from 'next';
import { OrdersPage } from '@/_pages/orders/ui/OrdersPage';

// 보호 경로 — 미로그인 접근은 proxy가 /login?next=/orders 로 보낸다 (RFC D2·D3).
export const metadata: Metadata = { title: '주문 내역' };

export default function Page() {
  return <OrdersPage />;
}
