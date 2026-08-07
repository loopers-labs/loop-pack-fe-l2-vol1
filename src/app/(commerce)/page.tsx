import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/get-query-client";
import { homeQueries } from "@/_pages/home/api/homeQueries";
import { getHomeServerData } from "@/_pages/home/api/home";
import { HomePage } from "@/_pages/home/ui/HomePage";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomeServerData();

  return {
    title: home.banner.title,
    description: home.banner.description,
    openGraph: {
      title: home.banner.title,
      description: home.banner.description,
      images: [home.banner.image],
    },
  };
}

export default async function Page() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    ...homeQueries.data(),
    queryFn: getHomeServerData,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}