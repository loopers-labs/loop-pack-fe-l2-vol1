import { Suspense } from 'react';

import { homeQueryOptions } from '@/_pages/home/api/homeQueries';
import { HeroCopy, HeroCopyFallback } from '@/_pages/home/ui/HeroCopy';
import { HeroSection } from '@/_pages/home/ui/HeroSection';
import { HomePageBoundary } from '@/_pages/home/ui/HomePageBoundary';
import { getQueryClient } from '@/shared/api/queryClient';
import { COMMON_OPEN_GRAPH, toOpenGraphImages } from '@/shared/config/siteMetadata';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

/**
 * 홈 metadata.
 *
 * 본문과 같은 query factory(homeQueryOptions)로 조회한다. 같은 render 안에서
 * URL·options 가 같은 native fetch 는 memoization 되므로, 본문 prefetch 와
 * 이 조회가 Route Handler 를 두 번 때리지 않는다.
 *
 * 조회가 실패하면 페이지별 빈 값을 만들지 않고 빈 객체를 돌려준다.
 * 그러면 root layout 의 공통 metadata 가 그대로 상속된다.
 *
 * 비용: generateMetadata 는 HTML 첫 바이트보다 먼저 끝나야 하므로
 * 여기서 기다리는 시간이 그대로 TTFB 에 실린다. 본문 스트리밍으로 없앤 대기가
 * 여기서 돌아오는지는 측정으로 확인한다(문서 4장).
 */
export async function generateMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();

  try {
    const { banner } = await queryClient.fetchQuery(homeQueryOptions.list());

    return {
      title: banner.title,
      description: banner.description,
      openGraph: {
        ...COMMON_OPEN_GRAPH,
        title: banner.title,
        description: banner.description,
        images: toOpenGraphImages(banner.image, banner.title),
      },
    };
  } catch {
    return {};
  }
}

/**
 * 홈
 * 요청마다 격리된 QueryClient로 홈 데이터를 prefetch 하고,
 * dehydrate, HydrationBoundary 로 클라이언트에 캐시를 전달한다.
 *
 * 경계는 데이터 소유권을 따른다. 홈 데이터를 기다려야 하는 것만 기다린다.
 * 페이지 제목·설명과 Hero 배경 이미지는 정적이라 초기 HTML 로 나가고,
 * Hero 문구와 카테고리·상품 목록만 Suspense 안에 둔다.
 *
 * prefetch 를 await 하지 않는다. await 하면 홈 API 응답이 끝날 때까지 HTML 자체가 나가지 못한다.
 * await 를 빼면 쿼리가 pending 상태로 dehydrate 되어 promise 째 전달되는데,
 * shared/api/queryClient.ts 의 shouldDehydrateQuery 가 pending 을 포함시키는 것이 그 전제다.
 */
export default function HomePage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(homeQueryOptions.list());

  return (
    <>
      <section className="week05-section">
        <h1>추천 상품 둘러보기</h1>
        <p>인기 상품과 새로 들어온 상품을 카테고리별로 살펴보세요.</p>
      </section>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <section className="week05-hero">
          <HeroSection>
            <Suspense fallback={<HeroCopyFallback />}>
              <HeroCopy />
            </Suspense>
          </HeroSection>
        </section>

        <HomePageBoundary />
      </HydrationBoundary>
    </>
  );
}
