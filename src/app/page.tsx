import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { homeQueryOptions } from '@/_pages/home/api/homeQueries';
import { HomeClient } from '@/_pages/home/ui/HomeClient';

export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.ensureQueryData(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  );
}
