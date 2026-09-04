import type { Metadata } from 'next';

import { CartPage } from '@/_pages/cart';

export const metadata: Metadata = { title: '장바구니' };

export default function Cart() {
  return <CartPage />;
}
