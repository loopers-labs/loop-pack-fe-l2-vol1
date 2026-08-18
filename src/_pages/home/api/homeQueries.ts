import { queryOptions } from '@tanstack/react-query';
import type { HomeResponse } from '@/types/commerce';

const HOME_STALE_TIME_MS = 1 * 60 * 1000;
const HOME_GC_TIME_MS = 10 * 60 * 1000;

function getApiBase(): string {
  return typeof window === 'undefined' ? (process.env.APP_ORIGIN ?? '') : '';
}

async function fetchHomeData(
  scenario?: string,
  signal?: AbortSignal,
): Promise<HomeResponse> {
  const searchParams = new URLSearchParams();

  if (scenario) {
    searchParams.set('scenario', scenario);
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  const url = `${getApiBase()}/api/home${query}`;
  const isServer = typeof window === 'undefined';
  const response = isServer
    ? await fetch(url)
    : await fetch(url, { signal });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : '홈 데이터를 불러오지 못했습니다.';

    throw new Error(message);
  }

  return await response.json() as Promise<HomeResponse>;
}

export function homeQueryOptions(scenario?: string) {
  return queryOptions({
    queryKey: ['home', { scenario }],
    queryFn: ({ signal }) => fetchHomeData(scenario, signal),
    staleTime: HOME_STALE_TIME_MS,
    gcTime: HOME_GC_TIME_MS,
  });
}
