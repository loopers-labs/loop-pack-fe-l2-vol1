import { queryOptions } from '@tanstack/react-query';
import { getHomeData } from './homeData';
import type { HomeResponse } from './types';

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ['home'],
    queryFn: (): HomeResponse => getHomeData(),
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
