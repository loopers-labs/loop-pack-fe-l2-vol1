import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { HomeContent } from "./HomeContent";
import { homeQueries } from "../api/home";
import { getQueryClient } from "@/shared/api";

// async 서버 컴포넌트: 홈 prefetch await 를 page 가 아니라 슬라이스 안에서 수행한다(목록 ProductListSection 과 대칭).
// 그래야 homeQueries·prefetch 배선이 슬라이스 밖으로 새지 않고, page 는 이 컴포넌트를 렌더만 한다.
//
// connection(): 홈은 서버에서 자기 /api/home 을 fetch 한다. 정적 prerender 는 빌드타임에 페이지를 실행하는데
// 그 시점엔 라우트 서버가 안 떠 있어 self-fetch 가 ECONNREFUSED 로 실패한다 → 요청당 렌더가 필요하다.
// connection() 이 이 렌더를 정적 -> 동적으로 바꿔 빌드 prerender 를 막는다.
// https://nextjs.org/docs/app/api-reference/functions/connection
export async function HomeSection() {
  await connection();

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(homeQueries.detail());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
}
