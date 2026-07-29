"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ProductGrid } from "@/widgets/product-card";
import { mapProductToCardItem } from "@/entities/product";
import { Pagination } from "./Pagination";
import { PRODUCT_LIST_PAGE_SIZE } from "./constants";
import { productQueries } from "./queries/productQueries";
import { ProductListContent } from "./ProductListContent";
import type { ProductCategoryFilter, ProductSort } from "./types";

type ProductListParams = {
  q: string;
  category: ProductCategoryFilter;
  sort: ProductSort;
  page: number;
};

type ProductListResultsProps = {
  params: ProductListParams;
  onPageChange: (page: number) => void;
  onPageReplace: (page: number) => void;
};

export function ProductListResults({
  params,
  onPageChange,
  onPageReplace,
}: ProductListResultsProps) {
  const queryClient = useQueryClient();
  const productsQuery = useQuery(
    productQueries.list({
      q: params.q,
      category: params.category,
      sort: params.sort,
      page: params.page,
      pageSize: PRODUCT_LIST_PAGE_SIZE,
    }),
  );

  const totalCount = productsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCT_LIST_PAGE_SIZE));
  const hasNextPage = params.page < totalPages;
  const products = productsQuery.data?.products.map(mapProductToCardItem) ?? [];

  useEffect(() => {
    if (productsQuery.data === undefined) {
      return;
    }

    if (params.page <= totalPages) {
      return;
    }

    onPageReplace(totalPages);
  }, [params.page, productsQuery.data, onPageReplace, totalPages]);

  useEffect(() => {
    if (productsQuery.data === undefined) {
      return;
    }

    if (!hasNextPage) {
      return;
    }

    void queryClient.prefetchQuery(
      productQueries.list({
        q: params.q,
        category: params.category,
        sort: params.sort,
        page: params.page + 1,
        pageSize: PRODUCT_LIST_PAGE_SIZE,
      }),
    );
  }, [
    hasNextPage,
    params.category,
    params.page,
    params.q,
    params.sort,
    productsQuery.data,
    queryClient,
  ]);

  return (
    <ProductListContent
      isLoading={productsQuery.isPending}
      error={productsQuery.error}
      isEmpty={products.length === 0}
      totalCount={totalCount}
      onRetry={() => void productsQuery.refetch()}
    >
      <div
        className={productsQuery.isPlaceholderData ? "opacity-60" : undefined}
        aria-label="상품 목록"
        aria-busy={productsQuery.isPlaceholderData}
      >
        <ProductGrid products={products} />
      </div>
      <Pagination currentPage={params.page} totalPages={totalPages} onPageChange={onPageChange} />
    </ProductListContent>
  );
}
