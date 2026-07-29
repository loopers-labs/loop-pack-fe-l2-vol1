import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { homeQueryOptions } from '@/queries/homeQueries';
import { getHomeData } from '@/app/api/_data/homeService';
import { HomeClient } from './HomeClient';

export default async function HomePage() {
  const queryClient = getQueryClient();
  queryClient.setQueryData(homeQueryOptions().queryKey, getHomeData());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  );
}
