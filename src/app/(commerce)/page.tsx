import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { HomePage } from '@/_pages/home/ui/HomePage';
import { homeQueries } from '@/_pages/home/api/home.queries';
import { getQueryClient } from '../get-query-client';
import { sharedOpenGraph } from '../shared-metadata';

// metadata가 홈 응답을 사용하므로 요청 시점 렌더링이 필요하다.
// 비용: document 응답이 홈 API(500ms)를 기다린다 — 측정·기록은 perf 문서 참조.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();
  try {
    // 본문 prefetch와 같은 query factory — 같은 GET URL·options라 fetch는 memoize된다.
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
    // 조회 실패 시 페이지별 빈 값을 만들지 않는다 — root 공통 metadata를 상속.
    return {};
  }
}

export default async function Page() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(homeQueries.home());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}
