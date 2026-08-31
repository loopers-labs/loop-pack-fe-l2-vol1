import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { CartContent } from '@/_pages/cart/ui/CartContent';
import { productListInfiniteQueryOptions } from '@/entities/product/api/productQueries';
import { getQueryClient } from '../getQueryClient';

export const metadata: Metadata = {
  title: '장바구니',
  description: '장바구니에 담은 상품을 확인하고 쇼핑을 계속하세요.',
};

export default async function CartPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery(
    productListInfiniteQueryOptions({ category: 'all', sort: 'latest' }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CartContent />
    </HydrationBoundary>
  );
}
