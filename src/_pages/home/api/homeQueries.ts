import { queryOptions } from '@tanstack/react-query';
import { fetchHomeData } from './homeService';

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ['home'],
    queryFn: ({ signal }) => fetchHomeData({ signal }),
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
