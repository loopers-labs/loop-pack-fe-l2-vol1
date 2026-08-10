import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getQueryClient } from "@/_app/config/getQueryClient";
import {
  loadProductListSearchParams,
  PRODUCT_LIST_PAGE_SIZE,
  ProductListPageClient,
  ProductListPageSkeleton,
  productQueries,
} from "@/_pages/products";
import { buildProductListMetadata } from "@/_pages/products/model/productListMetadata";
import type { SearchParams } from "nuqs/server";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await loadProductListSearchParams(searchParams);
  const query = productQueries.list({
    q: params.q,
    category: params.category,
    sort: params.sort,
    page: params.page,
    pageSize: PRODUCT_LIST_PAGE_SIZE,
  });

  try {
    const queryClient = getQueryClient();
    const data = await queryClient.fetchQuery(query);

    return buildProductListMetadata({ params, data });
  } catch {
    return {};
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await loadProductListSearchParams(searchParams);
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
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
