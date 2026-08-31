import type { Metadata } from 'next';

import { OrderNewPage } from '@/_pages/order-new';

export const metadata: Metadata = { title: '주문서' };

export default function OrderNew() {
  return <OrderNewPage />;
}
