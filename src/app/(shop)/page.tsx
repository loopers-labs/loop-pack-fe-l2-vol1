import { getQueryClient } from '@/lib/query/get-query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { homeQueryOptions } from '@/services/queries/home';

import { HomeSection } from './_components/HomeSection';

export const dynamic = 'force-dynamic';

/**
 * 홈
 * 요청마다 격리된 QueryClient로 홈 데이터를 서버에서 prefetch 하고,
 * dehydrate, HydrationBoundary 로 클라이언트에 캐시를 전달한다.
 * 로딩,에러 경계(Suspense/ErrorBoundary)는 client 컴포넌트 HomeSection 이 맡는다.
 */
export default async function HomePage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(homeQueryOptions.list());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeSection />
    </HydrationBoundary>
  );
}
