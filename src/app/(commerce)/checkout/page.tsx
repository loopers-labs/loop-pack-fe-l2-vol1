import type { Metadata } from 'next';
import { CheckoutPage } from '@/_pages/checkout/ui/CheckoutPage';

// 보호 경로 — 미로그인 접근은 proxy가 /login?next=/checkout 으로 보낸다 (RFC D2·D3).
export const metadata: Metadata = { title: '주문서' };

export default function Page() {
  return <CheckoutPage />;
}
