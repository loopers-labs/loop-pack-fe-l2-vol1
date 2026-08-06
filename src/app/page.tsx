import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/_app/getQueryClient";
import { homeQueryOptions } from "@/_pages/home/api/homeQuery";
import { HomePage } from "@/_pages/home/ui/HomePage";

// 홈 데이터를 서버에서 미리 받아 초기 HTML에 담는다.
// 이렇게 해야 Hero가 document 안에서 발견된다 — 브라우저가 JS를 받고 쿼리를
// 보낼 때까지 기다리지 않는다(Before의 발견 지연 3.3초가 여기서 나왔다).
export const dynamic = "force-dynamic";

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
