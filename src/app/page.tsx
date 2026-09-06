import type { Metadata } from 'next';
import { Suspense } from 'react';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from './getQueryClient';
import { HomeClient, homeQueryOptions } from '@/_pages/home';
import { getHomeData } from '@/app/api/_data/homeService';
import type { MockApiScenario } from '@/types/commerce';
import { HeroSection } from '@/examples/week-07-performance/HeroSection';

interface HomeDataProps {
  scenario?: MockApiScenario;
}

interface HomePageProps {
  searchParams: Promise<{
    scenario?: string | string[];
  }>;
}

const HOME_SCENARIOS = [
  'empty',
  'error',
  'slow',
] as const satisfies readonly MockApiScenario[];

const isHomeScenario = (value: string): value is MockApiScenario =>
  HOME_SCENARIOS.some((scenario) => scenario === value);

function parseHomeScenario(
  value: string | string[] | undefined,
): MockApiScenario | undefined {
  if (typeof value !== 'string') return undefined;

  return isHomeScenario(value) ? value : undefined;
}

async function HomeData({ scenario }: HomeDataProps) {
  const queryClient = getQueryClient();
  const query = homeQueryOptions(scenario);

  await queryClient.fetchQuery(query);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient scenario={scenario} />
    </HydrationBoundary>
  );
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  try {
    const params = await searchParams;
    const scenario = parseHomeScenario(params.scenario);
    const queryClient = getQueryClient();
    const { banner } = await queryClient.fetchQuery(
      homeQueryOptions(scenario),
    );

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
  } catch {
    return {};
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const scenario = parseHomeScenario(params.scenario);
  const { banner } = getHomeData();

  return (
    <main className="bg-white text-neutral-950">
      <div className="px-4 sm:px-6 lg:px-8">
        <HeroSection title={banner.title} description={banner.description} />
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[30vh] items-center justify-center px-4 sm:px-6">
            <div className="flex flex-col items-center gap-3">
              <div className="size-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950 motion-reduce:animate-none" />
              <p className="text-sm text-neutral-600">불러오는 중...</p>
            </div>
          </div>
        }
      >
        <HomeData scenario={scenario} />
      </Suspense>
    </main>
  );
}
