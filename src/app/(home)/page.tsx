import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { readServerSession } from '@/app/_lib/readServerSession';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
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

/* Week 9 1단계 — Header가 초기 HTML에 로그인 상태를 담으려면 서버가 읽은 세션이 필요하다.
   루트 layout이 아니라 이 페이지에서 읽는다. layout에서 cookies()를 부르면 하위 전체가 요청 시
   렌더링으로 바뀌어, 지금 정적으로 남아 있는 /examples·/performance-lab/inp까지 동적이 된다
   (변경 전 빌드 출력으로 확인함). 홈은 Week 7 Part 3에서 이미 force-dynamic이라 여기서 읽어도
   렌더링 범위가 달라지지 않는다 */
export default async function HomePage() {
  const queryClient = getQueryClient();
  const [session] = await Promise.all([
    readServerSession(),
    queryClient.prefetchQuery(homeQueryOptions()),
  ]);
  queryClient.setQueryData(SESSION_QUERY_KEY, session.user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
}
