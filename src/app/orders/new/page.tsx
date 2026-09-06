import type { Metadata } from 'next';
import { OrderCheckoutContent } from '@/_pages/order-checkout/ui/OrderCheckoutContent';
import { requireCurrentUser } from '@/app/_lib/session';
import { getLoginFrom } from '@/shared/lib/loginFrom';

export const metadata: Metadata = {
  title: '주문서',
  description: '장바구니에 담은 상품과 결제 금액을 확인하세요.',
};

interface OrderCheckoutPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function OrderCheckoutPage({
  searchParams,
}: OrderCheckoutPageProps) {
  const { from } = await searchParams;
  await requireCurrentUser('/orders/new', getLoginFrom(from));

  return <OrderCheckoutContent />;
}
