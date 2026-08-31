import type { Metadata } from 'next';
import { OrderCheckoutContent } from '@/_pages/order-checkout/ui/OrderCheckoutContent';
import { requireCurrentUser } from '@/app/_lib/session';

export const metadata: Metadata = {
  title: '주문서',
  description: '장바구니에 담은 상품과 결제 금액을 확인하세요.',
};

export default async function OrderCheckoutPage() {
  await requireCurrentUser('/orders/new');

  return <OrderCheckoutContent />;
}
