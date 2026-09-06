'use client';

import { useCallback, useState } from 'react';
import {
  hashKey,
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { InfiniteData, QueryKey } from '@tanstack/react-query';
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
type LastSuccessfulQuery = {
  dataUpdatedAt: number;
  queryHash: string;
  queryKey: QueryKey;
};

export function useInfiniteProducts(
  params: ProductListQuery,
  options: UseInfiniteProductsOptions = {},
) {
  const queryClient = useQueryClient();
  const [lastSuccessfulQuery, setLastSuccessfulQuery] =
    useState<LastSuccessfulQuery>();
  const queryOptions = productListInfiniteQueryOptions(params);
  const queryHash = hashKey(queryOptions.queryKey);
  const query = useInfiniteQuery({
    ...queryOptions,
    ...(options.shouldKeepPreviousData
      ? { placeholderData: keepPreviousData }
      : {}),
  });
  if (
    query.isSuccess &&
    !query.isPlaceholderData &&
    query.data &&
    (query.dataUpdatedAt !== lastSuccessfulQuery?.dataUpdatedAt ||
      queryHash !== lastSuccessfulQuery.queryHash)
  ) {
    setLastSuccessfulQuery({
      dataUpdatedAt: query.dataUpdatedAt,
      queryHash,
      queryKey: queryOptions.queryKey,
    });
  }

  const fallbackData = query.isError && lastSuccessfulQuery
    ? queryClient.getQueryData<ProductListInfiniteData>(
        lastSuccessfulQuery.queryKey,
      )
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
