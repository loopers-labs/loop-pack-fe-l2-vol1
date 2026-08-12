import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { HomePage, homeQueries } from "@/_pages/home";
import { getQueryClient } from "@/shared/api/get-query-client";
import { sharedOpenGraph } from "@/shared/config/seo";

// 홈 metadata는 요청 시점의 API 응답을 사용한다 (빌드 시점 고정 방지)
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();

  try {
    const home = await queryClient.fetchQuery(homeQueries.home());

    return {
      title: home.banner.title,
      description: home.banner.description,
      openGraph: {
        ...sharedOpenGraph,
        title: home.banner.title,
        description: home.banner.description,
        images: [home.banner.image],
      },
    };
  } catch {
    // metadata 조회 실패 시 페이지별 빈 값 대신 root 공통 metadata를 상속한다
    return {};
  }
}

// metadata와 본문은 각자 새 QueryClient를 쓰고, 같은 GET URL의 native fetch memoization으로 dedupe된다
export default async function Home() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(homeQueries.home());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}
