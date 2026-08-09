import type { Metadata } from "next";
import { getQueryClient } from "@/shared/api";
import { baseOpenGraph } from "@/shared/config";
import { homeQueries } from "./home";

// 본문(HomeSection)과 같은 query factory 로 배너를 조회한다 → 같은 GET URL 이라
// 같은 request 안에서 native fetch 가 memoize 되어 Route Handler 를 한 번만 친다.
export async function generateHomeMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();

  try {
    const { banner } = await queryClient.fetchQuery(homeQueries.detail());

    return {
      title: banner.title,
      description: banner.description,
      openGraph: {
        ...baseOpenGraph,
        title: banner.title,
        description: banner.description,
        images: [{ url: banner.image }],
      },
    };
  } catch {
    // 조회 실패 시 페이지별 빈 metadata 를 만들지 않는다 — 루트 공통 metadata 를 그대로 상속한다.
    return {};
  }
}
