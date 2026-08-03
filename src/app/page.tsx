import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { homeQueryOptions } from '@/_pages/home/api/homeQueries';
import { HomeClient } from '@/_pages/home/ui/HomeClient';

export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.ensureQueryData(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
              <p className="text-sm text-text-secondary">불러오는 중...</p>
            </div>
          </div>
        }
      >
        <HomeClient />
      </Suspense>
    </HydrationBoundary>
  );
}
