import { HydrationBoundary } from '@tanstack/react-query'
import type { Metadata, ResolvingMetadata } from 'next'

import { ProductServerService } from '@/entities/product/api/ProductServerService'
import { ProductListRouteParams } from '@/entities/product/model/ProductListRouteParams'
import { getAppOrigin } from '@/shared/config/getAppOrigin'
import { dehydratePendingQueries } from '@/shared/lib/dehydratePendingQueries'
import { getQueryClient } from '@/shared/lib/getQueryClient'
import { buildProductListMetadata } from '@/views/product-list/model/ProductListMetadata'
import { ProductListView } from '@/views/product-list/ui/ProductListView'

type ProductsPageProps = {
  readonly searchParams: Promise<{
    readonly [key: string]: string | ReadonlyArray<string> | undefined
  }>
}

export async function generateMetadata(
  { searchParams }: ProductsPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const request = ProductListRouteParams.toRequest(await searchParams)
  const origin = getAppOrigin()
  const serverService = new ProductServerService()

  return buildProductListMetadata(
    { origin, request, parent },
    {
      getQueryClient,
      loadProductList: (client, productRequest, appOrigin) =>
        client.fetchQuery(
          serverService.getProductList(productRequest, appOrigin),
        ),
    },
  )
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const request = ProductListRouteParams.toRequest(await searchParams)
  const queryClient = getQueryClient()

  if (request.scenario !== 'error') {
    const options = new ProductServerService().getProductList(
      request,
      getAppOrigin(),
    )
    void queryClient.prefetchQuery(options)
  }

  return (
    <HydrationBoundary state={dehydratePendingQueries(queryClient)}>
      <ProductListView diagnosticScenario={request} />
    </HydrationBoundary>
  )
}
