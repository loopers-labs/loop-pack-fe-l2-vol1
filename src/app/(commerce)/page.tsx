import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { HomePage, homeQueries, loadHomeSearchParams } from "@/_pages/home";
import { getHomeResponse } from "@/app/api/home/home-response";
import { getQueryClient } from "@/shared/api/get-query-client";
import { sharedOpenGraph, withSiteName } from "@/shared/config/seo";
import type { MockApiScenario } from "@/types/commerce";

// 홈 metadata는 요청 시점의 데이터를 사용한다 (빌드 시점 고정 방지)
export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// 서버에서는 Route Handler HTTP 왕복 대신 데이터 함수를 직접 호출한다.
// queryKey는 클라이언트 refetch(HTTP)와 같아 hydration 후 캐시가 이어진다
const homeServerQuery = (scenario: MockApiScenario | null) => ({
  ...homeQueries.home(scenario),
  queryFn: () => getHomeResponse(scenario),
});

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const { scenario } = loadHomeSearchParams(await searchParams);
  const queryClient = getQueryClient();

  try {
    const home = await queryClient.fetchQuery(homeServerQuery(scenario));

    return {
      // 홈은 root template이 걸리지 않는 세그먼트라 접미사를 직접 붙이고 absolute로 고정한다
      title: { absolute: withSiteName(home.banner.title) },
      description: home.banner.description,
      alternates: { canonical: "/" },
      openGraph: {
        ...sharedOpenGraph,
        title: home.banner.title,
        description: home.banner.description,
        url: "/",
        // 배너 이미지 크기는 API가 알려주지 않으므로 alt만 채운다
        images: [{ url: home.banner.image, alt: home.banner.title }],
      },
    };
  } catch {
    // metadata 조회 실패 시 title·description·og는 root 공통 metadata를 상속한다.
    // canonical은 조회 결과와 무관하게 URL만으로 정해지므로 실패해도 유지한다
    return { alternates: { canonical: "/" } };
  }
}

// prefetch를 await하지 않고 pending 상태로 dehydrate해 셸을 먼저 스트리밍한다.
// metadata의 fetchQuery와는 데이터 함수의 React cache로 요청당 한 번만 실행된다
export default async function Home({ searchParams }: HomeProps) {
  const { scenario } = loadHomeSearchParams(await searchParams);
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(homeServerQuery(scenario));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage scenario={scenario} />
    </HydrationBoundary>
  );
}
