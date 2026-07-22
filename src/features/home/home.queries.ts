import { queryOptions } from '@tanstack/react-query';
import { getHome } from './home.api';

export const homeQueries = {
  home: () =>
    queryOptions({
      queryKey: ['home'],
      queryFn: getHome,
      staleTime: 1000 * 60 * 5, // 배너·카테고리는 거의 안 바뀜 → 5분
    }),
};
