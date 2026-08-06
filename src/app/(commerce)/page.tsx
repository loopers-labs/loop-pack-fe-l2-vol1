import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getQueryClient } from "@/_app/config/getQueryClient";
import { HomeErrorBoundary, HomeLoading, HomePageClient, homeQueries } from "@/_pages/home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(homeQueries.main());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeErrorBoundary>
        <Suspense fallback={<HomeLoading />}>
          <HomePageClient />
        </Suspense>
      </HomeErrorBoundary>
    </HydrationBoundary>
  );
}
