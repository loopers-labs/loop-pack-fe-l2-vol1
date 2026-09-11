"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ProductGrid } from "@/widgets/product-card";
import { mapProductToCardItem } from "@/entities/product";
import { Pagination } from "./Pagination";
import { ProductListContent } from "./ProductListContent";
import { PRODUCT_LIST_PAGE_SIZE } from "../model/constants";
import { useRetainedProductListDataOnRefreshError } from "../model/useRetainedProductListDataOnRefreshError";
import { productQueries } from "../queries/productQueries";
import type { ProductCategoryFilter, ProductListScenario, ProductSort } from "../model/types";

type ProductListParams = {
  q: string;
  category: ProductCategoryFilter;
  sort: ProductSort;
  page: number;
  scenario: ProductListScenario;
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
  const productListQueryOptions = useMemo(
    () =>
      productQueries.list({
        q: params.q,
        category: params.category,
        sort: params.sort,
        page: params.page,
        pageSize: PRODUCT_LIST_PAGE_SIZE,
        scenario: params.scenario,
      }),
    [params.category, params.page, params.q, params.scenario, params.sort],
  );
  const productsQuery = useQuery(productListQueryOptions);
  const displayData = useRetainedProductListDataOnRefreshError({
    queryClient,
    queryKey: productListQueryOptions.queryKey,
    queryResult: productsQuery,
  });
  const totalCount = displayData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCT_LIST_PAGE_SIZE));
  const hasNextPage = params.page < totalPages;
  const products = displayData?.products.map(mapProductToCardItem) ?? [];

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
        scenario: params.scenario,
      }),
    );
  }, [
    hasNextPage,
    params.category,
    params.page,
    params.q,
    params.scenario,
    params.sort,
    productsQuery.data,
    queryClient,
  ]);

  return (
    <ProductListContent
      isLoading={productsQuery.isPending && displayData === undefined}
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
