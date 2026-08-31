'use client';

import { useQueries } from '@tanstack/react-query';
import { productDetailQueryOptions } from '@/entities/product/api/productQueries';
import type { Product } from '@/entities/product/model/types';

export function useCartProducts(productIds: readonly string[]) {
  const uniqueProductIds = [...new Set(productIds)];
  const queries = useQueries({
    queries: uniqueProductIds.map((productId) =>
      productDetailQueryOptions(productId),
    ),
  });

  const products = new Map<string, Product>();
  queries.forEach((query) => {
    if (query.data) {
      products.set(query.data.id, query.data);
    }
  });

  const refetch = async () => {
    await Promise.all(queries.map((query) => query.refetch()));
  };

  return {
    products,
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    refetch,
  };
}
