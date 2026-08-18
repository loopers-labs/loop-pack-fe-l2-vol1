import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getQueryClient } from "@/_app/getQueryClient";
import { homeQueryOptions } from "@/_pages/home/api/homeQuery";
import { HomePage } from "@/_pages/home/ui/HomePage";
import { commonOpenGraph } from "./layout";

// 홈 데이터를 서버에서 미리 받아 초기 HTML에 담는다.
// 이렇게 해야 Hero가 document 안에서 발견된다 — 브라우저가 JS를 받고 쿼리를
// 보낼 때까지 기다리지 않는다(Before의 발견 지연 3.3초가 여기서 나왔다).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();
  try {
    // 본문 prefetch와 같은 query factory다 — 같은 render/request 안의
    // 같은 URL·options 이므로 native fetch가 memoize되어 호출이 늘지 않는다.
    const home = await queryClient.fetchQuery(homeQueryOptions());
    return {
      title: home.banner.title,
      description: home.banner.description,
      openGraph: {
        ...commonOpenGraph,
        title: home.banner.title,
        description: home.banner.description,
        images: [{ url: home.banner.image }],
      },
    };
  } catch {
    // 조회 실패 시 페이지별 빈 metadata를 만들지 않는다 — root 공통값을 그대로 상속한다.
    return {};
  }
}

export default async function Page() {
  const queryClient = getQueryClient();
  // prefetchQuery는 실패를 삼킨다 — 서버가 못 받으면 브라우저 useQuery가 이어서 시도한다.
  await queryClient.prefetchQuery(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}
