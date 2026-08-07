import type { Metadata } from 'next';
import { Suspense } from 'react';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { HomeClient, homeQueryOptions } from '@/_pages/home';
import { HeroSection } from '@/examples/week-07-performance/HeroSection';

export async function generateMetadata(): Promise<Metadata> {
  const queryClient = getQueryClient();
  const { banner } = await queryClient.fetchQuery(homeQueryOptions());

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
  const { banner } = await queryClient.ensureQueryData(homeQueryOptions());

  return (
    <main>
      <HeroSection
        title={banner.title}
        description={banner.description}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
                <p className="text-sm text-text-secondary">불러오는 중...</p>
              </div>
            </div>
          }
        >
          <HomeClient />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
