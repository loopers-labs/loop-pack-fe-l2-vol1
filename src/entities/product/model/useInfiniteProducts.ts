'use client';

import { useCallback } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { productListInfiniteQueryOptions } from '@/entities/product/api/productQueries';
import { mergeProducts } from '@/entities/product/lib/mergeProducts';
import type { ProductListQuery } from '@/entities/product/model/types';

interface UseInfiniteProductsOptions {
  shouldKeepPreviousData?: boolean;
}

export function useInfiniteProducts(
  params: ProductListQuery,
  options: UseInfiniteProductsOptions = {},
) {
  const query = useInfiniteQuery({
    ...productListInfiniteQueryOptions(params),
    ...(options.shouldKeepPreviousData
      ? { placeholderData: keepPreviousData }
      : {}),
  });
  const products = mergeProducts(query.data?.pages ?? []);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return { ...query, products, loadMore };
}
