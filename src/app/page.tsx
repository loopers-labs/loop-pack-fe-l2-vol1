import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { HomePage, homeQueries } from "@/_pages/home";
import { getQueryClient } from "@/shared/api/get-query-client";
import { sharedOpenGraph, withSiteName } from "@/shared/config/seo";

// 홈 metadata는 요청 시점의 API 응답을 사용한다 (빌드 시점 고정 방지)
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();

  try {
    const home = await queryClient.fetchQuery(homeQueries.home());

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
