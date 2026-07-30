import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getQueryClient } from "../../get-query-client";
import { ProductListPageClient } from "@/features/products/ProductListPageClient";
import { ProductListPageSkeleton } from "@/features/products/ProductListPageSkeleton";
import { PRODUCT_LIST_PAGE_SIZE } from "@/features/products/constants";
import { productQueries } from "@/features/products/queries/productQueries";
import { loadProductListSearchParams } from "@/features/products/searchParams";
import type { SearchParams } from "nuqs/server";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await loadProductListSearchParams(searchParams);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    productQueries.list({
      q: params.q,
      category: params.category,
      sort: params.sort,
      page: params.page,
      pageSize: PRODUCT_LIST_PAGE_SIZE,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ProductListPageSkeleton />}>
        <ProductListPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
