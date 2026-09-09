import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { requireSession } from '@/app/_lib/requireSession';
import { toCurrentPath, type PageSearchParams } from '@/app/_lib/currentPath';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { OrderFormView } from './_ui/OrderFormView';

type PageProps = {
  searchParams: Promise<PageSearchParams>;
};

export const metadata: Metadata = {
  title: '주문서',
  description: '장바구니에 담은 상품을 주문합니다.',
};

const ORDER_FORM_PATH = '/orders/new';

export default async function NewOrderPage({ searchParams }: PageProps) {
  const session = await requireSession(toCurrentPath(ORDER_FORM_PATH, await searchParams));

  const queryClient = getQueryClient();
  queryClient.setQueryData(SESSION_QUERY_KEY, session.user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrderFormView />
    </HydrationBoundary>
  );
}
