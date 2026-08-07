import type { Metadata } from "next";
import { homeQueries } from "@/_pages/home";
import { getQueryClient } from "@/shared/api/get-query-client";
import { sharedOpenGraph } from "@/shared/config/seo";

export { HomePage as default } from "@/_pages/home";

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
