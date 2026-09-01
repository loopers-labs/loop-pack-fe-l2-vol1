'use client';

import { useCallback } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { productListInfiniteQueryOptions } from '@/entities/product/api/productQueries';
import { mergeProducts } from '@/entities/product/lib/mergeProducts';
import type {
  ProductListQuery,
  ProductListResponse,
} from '@/entities/product/model/types';

interface UseInfiniteProductsOptions {
  shouldKeepPreviousData?: boolean;
}

type ProductListInfiniteData = InfiniteData<ProductListResponse, number>;

function getLatestSuccessfulData(
  queryClient: QueryClient,
): ProductListInfiniteData | undefined {
  const queries = queryClient.getQueryCache().findAll({
    queryKey: ['products', 'infinite'],
  });
  const latest = queries
    .filter((query) => query.state.data !== undefined)
    .sort((left, right) => right.state.dataUpdatedAt - left.state.dataUpdatedAt)
    .at(0);

  return latest?.state.data as ProductListInfiniteData | undefined;
}

export function useInfiniteProducts(
  params: ProductListQuery,
  options: UseInfiniteProductsOptions = {},
) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    ...productListInfiniteQueryOptions(params),
    ...(options.shouldKeepPreviousData
      ? { placeholderData: keepPreviousData }
      : {}),
  });
  const fallbackData = query.isError
    ? getLatestSuccessfulData(queryClient)
    : undefined;
  const data = query.data ?? fallbackData;
  const isShowingFallback =
    query.isError && query.data === undefined && fallbackData !== undefined;
  const products = mergeProducts(data?.pages ?? []);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return { ...query, data, isShowingFallback, products, loadMore };
}
