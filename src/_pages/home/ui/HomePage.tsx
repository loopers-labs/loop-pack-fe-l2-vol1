import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { homeQueries } from '../api/homeQueries';
import HomeSection from './HomeSection';
import HomeErrorFallback from './HomeErrorFallback';
import HomeLoadingFallback from './HomeLoadingFallback';

// AI 생성: 서버에서 홈 쿼리를 미리 채운 뒤 dehydrate한 캐시를 클라이언트로 넘긴다. 이렇게 하면
// 클라이언트의 useSuspenseQuery가 첫 렌더에서 캐시 hit이 되어 Suspense 폴백으로 되돌아가는 깜빡임과
// 서버·클라이언트 중복 fetch가 사라진다.
export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(homeQueries.detail());

  return (
    <main className="page-container">
      {/* AI 생성: week-07 3단계 — 배너 데이터와 무관한 정적 h1. Suspense 밖에 둬 초기 HTML에
          항상 하나의 h1을 보장한다(hero의 h2는 그대로 유지). */}
      <h1>이번 주 추천 상품</h1>
      <ErrorBoundary fallback={<HomeErrorFallback />}>
        <Suspense fallback={<HomeLoadingFallback />}>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <HomeSection />
          </HydrationBoundary>
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
