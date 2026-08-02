'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductListQuery } from '../model/product';
import { productsQueryOptions } from './productsQueryOptions';

export function useProductList(query: ProductListQuery) {
  const result = useQuery(productsQueryOptions(query));
  const queryClient = useQueryClient();
  const { q, category, sort, page = 1 } = query;
  const isUnfiltered = !q && (category === undefined || category === 'all');

  useEffect(() => {
    if (!isUnfiltered || !result.data) return;

    const totalPages = Math.max(1, Math.ceil(result.data.totalCount / result.data.pageSize));
    const hasNextPage = page < totalPages;

    if (hasNextPage) {
      queryClient.prefetchQuery(productsQueryOptions({ q, category, sort, page: page + 1 }));
    }
  }, [isUnfiltered, result.data, page, q, category, sort, queryClient]);

  return result;
}
