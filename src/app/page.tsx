import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { homeQueryOptions } from '@/queries/homeQueries';
import { HomeClient } from './HomeClient';

export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.ensureQueryData(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  );
}
