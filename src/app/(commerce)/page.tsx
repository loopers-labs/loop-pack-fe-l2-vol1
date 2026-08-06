import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getQueryClient } from "@/_app/config/getQueryClient";
import { HomeErrorBoundary, HomeLoading, HomePageClient, homeQueries } from "@/_pages/home";
import { buildHomeMetadata } from "@/_pages/home/model/homeMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const queryClient = getQueryClient();
    const data = await queryClient.fetchQuery(homeQueries.main());

    return buildHomeMetadata(data);
  } catch {
    return {};
  }
}

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
