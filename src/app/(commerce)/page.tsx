import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/get-query-client";
import { homeQueries } from "@/_pages/home/api/homeQueries";
import { getHomeServerData } from "@/_pages/home/api/home";
import { HomePage } from "@/_pages/home/ui/HomePage";
import { SITE_OPENGRAPH } from '@/shared/config/site-metadata';
import type { MockApiScenario } from '@/shared/api';

type Props = {
  searchParams: Promise<{ scenario?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  try {
    const { scenario } = await searchParams;
    const home = await getHomeServerData(scenario as MockApiScenario | undefined);

    return {
      title: home.banner.title,
      description: home.banner.description,
      openGraph: {
        ...SITE_OPENGRAPH,
        title: home.banner.title,
        description: home.banner.description,
        images: [home.banner.image],
      },
    };
  } catch {
    // 조회 실패 시 root 공통 metadata를 그대로 상속 (페이지별 빈 값을 만들지 않음)
    return {};
  }
}

export default async function Page({ searchParams }: Props) {
  const { scenario } = await searchParams;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    ...homeQueries.data(),
    queryFn: () => getHomeServerData(scenario as MockApiScenario | undefined),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}