import type { Metadata } from 'next';
import { OrderHistoryContent } from '@/_pages/order-history/ui/OrderHistoryContent';
import { requireCurrentUser } from '@/app/_lib/session';

export const metadata: Metadata = {
  title: '주문 내역',
  description: '지금까지 주문한 상품을 확인하세요.',
};

export default async function OrderHistoryPage() {
  await requireCurrentUser('/orders', 'orders');

  return <OrderHistoryContent />;
}
