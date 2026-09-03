import type { Metadata } from 'next';
import { OrderHistoryPage } from '@/_pages/order-history/ui/OrderHistoryPage';

export const metadata: Metadata = {
  title: '주문내역',
};

export default function Page() {
  return <OrderHistoryPage />;
}
