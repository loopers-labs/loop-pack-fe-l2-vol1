import { productQueries } from '@/entities/product/api/queries';
import { PAGE_SIZE } from '@/features/product-filters/model/useProductListFilters';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useProductList = (page: number, query: object) => {
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useQuery(
    productQueries.list(query)
  );

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / (data?.pageSize ?? PAGE_SIZE)));

  const queryClient = useQueryClient();
  useEffect(() => {
    if (page >= totalPages) return;
    const nextQuery = { ...query, page: page + 1 };
    queryClient.prefetchQuery(productQueries.list(nextQuery));
  });

  return {
    data,
    isPending,
    isError,
    isPlaceholderData,
    error,
    totalPages,
    totalCount,
    refetch,
  };
};
