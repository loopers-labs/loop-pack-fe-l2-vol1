import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/apiFetch';
import { getProductList } from './getProductList';
import { toProductListQuery } from './toProductListQuery';
import type { CategoryId, ProductSort } from '@/entities/product';

export type ProductListFilters = {
  q: string;
  category: CategoryId | 'all';
  sort: ProductSort;
  page: number;
};

export const productQueries = {
  all: () => ['product'] as const,
  list: (filters: ProductListFilters) => {
    const query = toProductListQuery(filters);
    return queryOptions({
      queryKey: [...productQueries.all(), 'list', query],
      queryFn: ({ signal }) => getProductList(query, signal),
      // 4xx는 재요청해도 결과가 같으므로 즉시 실패, 5xx·네트워크 예외만 1회 재시도한다(에러 화면 노출까지의 대기 시간을 짧게 유지).
      retry: (failureCount, error) => failureCount < 1 && !(error instanceof ApiError && error.status < 500),
      // 필터 전환 중 이전 목록을 유지해 결과 영역이 폴백으로 대체되지 않게 한다.
      placeholderData: keepPreviousData
    });
  }
};
