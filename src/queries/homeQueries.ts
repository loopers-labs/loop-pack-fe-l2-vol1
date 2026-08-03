import { GC_TIME, STALE_TIME } from '@/shared/constants/time';
import { getHome } from '@/service/home';
import { queryOptions } from '@tanstack/react-query';

export const homeQueries = {
  all: () => ['home'] as const,

  data: () =>
    queryOptions({
      queryKey: [...homeQueries.all()],
      queryFn: getHome,
      staleTime: STALE_TIME.HOME,
      gcTime: GC_TIME.HOME,
    }),
};
