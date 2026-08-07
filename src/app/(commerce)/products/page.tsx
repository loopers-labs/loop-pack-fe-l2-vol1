import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/get-query-client";
import { productsQueries } from "@/entities/product/api/productsQueries";
import { getProductsServerData } from "@/entities/product/api/products";
import { buildProductsMetadataText } from "@/_pages/product-list/api/products-metadata";
import { ProductListPage } from "@/_pages/product-list/ui/ProductListPage";
import type { CategoryId, ProductSort } from "@/entities/product/model";
import { SITE_OPENGRAPH } from '@/shared/config/site-metadata';
import type { MockApiScenario } from "@/shared/api";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
    scenario?: string;
  }>;
};

function normalizeQuery(params: Awaited<Props["searchParams"]>) {
  return {
    q: params.q ?? "",
    category: (params.category ?? "all") as CategoryId | "all",
    sort: (params.sort ?? "latest") as ProductSort,
    page: params.page ? Number(params.page) : 1,
    scenario: (params.scenario ?? null) as MockApiScenario | null,
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  try {
    const params = await searchParams;
    const query = normalizeQuery(params);
    const data = await getProductsServerData(query);
    const { title, description } = buildProductsMetadataText({ query, data });

    return {
      title,
      description,
      openGraph: {
        ...SITE_OPENGRAPH,
        title,
        description,
        images: data.products[0]?.image ? [data.products[0].image] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const query = normalizeQuery(params);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    ...productsQueries.productList(query),
    queryFn: () => getProductsServerData(query),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListPage />
    </HydrationBoundary>
  );
}