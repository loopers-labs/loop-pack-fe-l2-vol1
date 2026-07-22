import { getHome } from '@/service/home';
import { queryOptions } from '@tanstack/react-query';

export const homeQueries = {
  all: () => ['home'] as const,

  data: () =>
    queryOptions({
      queryKey: [...homeQueries.all()],
      queryFn: getHome,
    }),
};
