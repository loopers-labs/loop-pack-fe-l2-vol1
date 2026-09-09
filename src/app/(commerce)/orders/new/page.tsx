import type { Metadata } from 'next';
import { CheckoutPage } from '@/_pages/checkout/ui/CheckoutPage';

export const metadata: Metadata = {
  title: '주문서',
};

export default function Page() {
  return <CheckoutPage />;
}
