import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { readServerSession } from '@/app/_lib/readServerSession';
import { readSingleParam, type PageSearchParams } from '@/app/_lib/currentPath';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import {
  EXPIRED_PARAM,
  isExpiredFlag,
  REDIRECT_PARAM,
  safeRedirectPath,
} from '@/shared/lib/safeRedirectPath';
import { LoginView } from './_ui/LoginView';

type PageProps = {
  searchParams: Promise<PageSearchParams>;
};

export const metadata: Metadata = {
  title: '로그인',
  description: '주문서와 주문 내역을 이용하려면 로그인이 필요합니다.',
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await readServerSession();

  const queryClient = getQueryClient();
  queryClient.setQueryData(SESSION_QUERY_KEY, session.user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LoginView
        redirectPath={safeRedirectPath(readSingleParam(params[REDIRECT_PARAM]))}
        expired={isExpiredFlag(readSingleParam(params[EXPIRED_PARAM]))}
      />
    </HydrationBoundary>
  );
}
