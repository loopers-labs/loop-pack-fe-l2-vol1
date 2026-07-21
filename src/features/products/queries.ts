import { queryOptions } from '@tanstack/react-query';

import { getHome } from './api';

/**
 * 상품 도메인 쿼리 팩토리
 */
export const productQueries = {
  home: () =>
    queryOptions({
      queryKey: ['products', 'home'] as const,
      queryFn: getHome,
      // FIXME: staleTime, gcTime 설계
    }),
};
