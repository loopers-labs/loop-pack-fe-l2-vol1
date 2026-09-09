import type { Metadata } from 'next';
import { OrderCheckoutContent } from '@/_pages/order-checkout/ui/OrderCheckoutContent';
import { requireCurrentUser } from '@/app/_lib/session';
import {
  LOGIN_SOURCE_SEARCH_PARAM,
  type LoginSourceSearchParams,
} from '@/features/auth/lib/authNavigation';
import { getLoginEntrySource } from '@/shared/lib/loginEntrySource';

export const metadata: Metadata = {
  title: '주문서',
  description: '장바구니에 담은 상품과 결제 금액을 확인하세요.',
};

interface OrderCheckoutPageProps {
  searchParams: Promise<LoginSourceSearchParams>;
}

export default async function OrderCheckoutPage({
  searchParams,
}: OrderCheckoutPageProps) {
  const params = await searchParams;
  const loginSource = getLoginEntrySource(
    params[LOGIN_SOURCE_SEARCH_PARAM],
  );
  await requireCurrentUser('/orders/new', loginSource);

  return <OrderCheckoutContent />;
}
