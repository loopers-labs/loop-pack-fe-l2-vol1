import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { COMMON_OPEN_GRAPH, OG_FALLBACK_IMAGE } from '@/app/layout';
import { homeQueryOptions } from './_api/homeQueryOptions';
import { HomeView } from './_ui/HomeView';

/* AI-generated : Week 7 Part 3 — 홈은 주소가 고정이라 Next가 정적 라우트로 판단해 빌드 시점에 프리렌더한다.
   그런데 데이터 출처인 /api/home이 같은 앱의 Route Handler라 빌드 중에는 서버가 떠 있지 않아 조회가 실패하고,
   빈 상태로 HTML이 저장된다. 본문은 하이드레이션 후 클라이언트가 다시 조회해 복구되지만 metadata는 서버에서만
   생성되므로 복구 경로가 없어 루트 기본값에 머문다. 요청 시점 렌더로 바꿔 metadata가 실제 응답을 쓰게 한다 */
export const dynamic = 'force-dynamic';

/* AI-generated : Week 7 Part 3 — 본문 prefetch와 "같은 query factory"(homeQueryOptions)로 조회해
   같은 GET URL·options가 되게 한다. 그래야 같은 render/request 안에서 Next.js의 fetch memoization이 걸려
   Route Handler 호출이 1회로 유지된다. 조회에 실패하면 페이지별 빈 값을 만들지 않고 빈 객체를 반환해
   루트 공통 metadata를 그대로 상속시킨다 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const queryClient = getQueryClient();
    const { banner } = await queryClient.fetchQuery(homeQueryOptions());

    return {
      title: banner.title,
      description: banner.description,
      alternates: { canonical: '/' },
      openGraph: {
        ...COMMON_OPEN_GRAPH,
        title: banner.title,
        description: banner.description,
        url: '/',
        images: [banner.image || OG_FALLBACK_IMAGE.url],
      },
    };
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(homeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
}
