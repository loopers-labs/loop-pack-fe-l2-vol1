"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { mapProductToCardItem } from "@/components/commerce/productCardAdapter";
import { Pagination } from "./Pagination";
import { ProductFilters } from "./ProductFilters";
import { ProductListContent } from "./ProductListContent";
import { productQueries } from "./queries/productQueries";
import { useProductListSearchParams } from "./useProductListSearchParams";

const PRODUCT_LIST_PAGE_SIZE = 12;

export function ProductListContainer() {
  const { params, setSearchQuery, setCategory, setSort, setPage, replacePage, resetFilters } =
    useProductListSearchParams();

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
  const products = productsQuery.data?.products.map(mapProductToCardItem) ?? [];

  useEffect(() => {
    if (productsQuery.data === undefined) {
      return;
    }

    if (params.page <= totalPages) {
      return;
    }

    replacePage(totalPages);
  }, [params.page, productsQuery.data, replacePage, totalPages]);

  return (
    <>
      <section className="mt-10">
        <h1 className="mb-4">상품 목록</h1>
        <ProductFilters
          q={params.q}
          category={params.category}
          sort={params.sort}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onReset={resetFilters}
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
          <Pagination currentPage={params.page} totalPages={totalPages} onPageChange={setPage} />
        </ProductListContent>
      </section>
    </>
  );
}
