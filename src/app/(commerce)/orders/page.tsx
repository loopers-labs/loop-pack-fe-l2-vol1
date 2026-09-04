import type { Metadata } from 'next';

import { OrdersPage } from '@/_pages/orders';

export const metadata: Metadata = { title: '주문 내역' };

export default function Orders() {
  return <OrdersPage />;
}
