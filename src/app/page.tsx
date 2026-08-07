import type { Metadata } from 'next';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { homeQueryOptions } from '@/_pages/home/api/homeQueries';
import { getHomeData } from '@/_pages/home/api/homeService';
import { HomeClient } from '@/_pages/home/ui/HomeClient';
import { HeroSection } from '@/examples/week-07-performance/HeroSection';

export async function generateMetadata(): Promise<Metadata> {
  const { banner } = getHomeData();

  return {
    title: banner.title,
    description: banner.description,
    openGraph: {
      title: `${banner.title} | Aesthetic`,
      description: banner.description,
      images: [{ url: banner.image }],
      siteName: 'Aesthetic',
      locale: 'ko_KR',
      type: 'website',
    },
  };
}

export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.ensureQueryData(homeQueryOptions());

  return (
    <main>
      <section className="px-8 pt-10 pb-4">
        <h1 className="font-family-display text-2xl font-normal text-text">
          매일 새롭게 발견하는 취향
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          나다운 일상을 완성하는 라이프스타일 셀렉트숍
        </p>
      </section>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <>
              <HeroSection />
              <div className="flex min-h-[30vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
                  <p className="text-sm text-text-secondary">불러오는 중...</p>
                </div>
              </div>
            </>
          }
        >
          <HomeClient />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
