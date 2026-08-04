import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { HomeContent } from './HomeContent';

import { productQueries } from '@/entities/product';
import { getQueryClient } from '@/shared/get-query-client';

export function HomePage() {
  return (
    <Suspense
      fallback={
        <p className="week05-status" role="status">
          홈을 불러오는 중입니다…
        </p>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  // 빌드 중이 아니라 실제 요청이 들어온 뒤에 내부 API를 부르게 한다.
  await connection();

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(productQueries.home());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
}
