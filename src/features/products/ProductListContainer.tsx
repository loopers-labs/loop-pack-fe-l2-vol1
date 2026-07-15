"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useEffect } from "react";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { mapProductToCardItem } from "@/components/commerce/productCardAdapter";
import { Pagination } from "./Pagination";
import { ProductFilters } from "./ProductFilters";
import { ProductListContent } from "./ProductListContent";
import { productQueries } from "./queries/productQueries";
import { productListSearchParams } from "./searchParams";
import type { ProductCategoryFilter, ProductSort } from "./types";

const PRODUCT_LIST_PAGE_SIZE = 12;

export function ProductListContainer() {
  const [params, setParams] = useQueryStates(productListSearchParams, {
    history: "push",
  });

  const productsQuery = useQuery(
    productQueries.list({
      q: params.q,
      category: params.category,
      sort: params.sort,
      page: params.page,
      pageSize: PRODUCT_LIST_PAGE_SIZE,
    }),
  );

  const handleSearchChange = (q: string) => {
    void setParams({ q, page: 1 });
  };

  const handleCategoryChange = (category: ProductCategoryFilter) => {
    void setParams({ category, page: 1 });
  };

  const handleSortChange = (sort: ProductSort) => {
    void setParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    void setParams({ page });
  };

  const handleResetFilters = () => {
    void setParams({
      q: "",
      category: "all",
      sort: "latest",
      page: 1,
    });
  };

  const totalCount = productsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCT_LIST_PAGE_SIZE));
  const products = productsQuery.data?.products.map(mapProductToCardItem) ?? [];

  useEffect(() => {
    if (productsQuery.data === undefined) {
      return;
    }

    if (params.page <= totalPages) {
      return;
    }

    void setParams({ page: totalPages }, { history: "replace" });
  }, [params.page, productsQuery.data, setParams, totalPages]);

  return (
    <>
      <section className="mt-10">
        <h1 className="mb-4">상품 목록</h1>
        <ProductFilters
          q={params.q}
          category={params.category}
          sort={params.sort}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          onReset={handleResetFilters}
        />
      </section>

      <section className="mt-10" aria-label="상품 검색 결과">
        <ProductListContent
          isLoading={productsQuery.isPending}
          error={productsQuery.error}
          isEmpty={products.length === 0}
          totalCount={totalCount}
          onRetry={() => void productsQuery.refetch()}
        >
          <ProductGrid products={products} />
          <Pagination
            currentPage={params.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </ProductListContent>
      </section>
    </>
  );
}
