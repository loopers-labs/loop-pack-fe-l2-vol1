import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { requireSession } from '@/app/_lib/requireSession';
import { toCurrentPath, type PageSearchParams } from '@/app/_lib/currentPath';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { OrderListView } from './_ui/OrderListView';

type PageProps = {
  searchParams: Promise<PageSearchParams>;
};

export const metadata: Metadata = {
  title: '주문 내역',
  description: '지금까지 주문한 내역입니다.',
};

const ORDERS_PATH = '/orders';

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await requireSession(toCurrentPath(ORDERS_PATH, await searchParams));

  const queryClient = getQueryClient();
  queryClient.setQueryData(SESSION_QUERY_KEY, session.user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrderListView />
    </HydrationBoundary>
  );
}
