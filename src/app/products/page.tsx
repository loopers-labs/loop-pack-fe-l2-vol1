import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import type { SearchParams } from 'nuqs/server'
import type { JSX } from 'react'
import {
  buildProductListMetadata,
  loadProductListParamsAsync,
  ProductListContent,
  ProductListPage,
} from '@/_pages/product-list'
import { productListQueryOptions } from '@/entities/product'
import { getServerQueryClient } from '@/shared/api/getServerQueryClient'

interface ProductsPageProps {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  await connection()
  const query = await loadProductListParamsAsync(searchParams)

  try {
    const queryClient = getServerQueryClient()
    const data = await queryClient.fetchQuery(productListQueryOptions(query))
    return buildProductListMetadata(query, data)
  } catch {
    return {}
  }
}

// 라우팅 진입점 — 조합은 _pages/product-list가 한다.
export default function Page({ searchParams }: ProductsPageProps): JSX.Element {
  return (
    <ProductListPage>
      <PrefetchedProductList searchParams={searchParams} />
    </ProductListPage>
  )
}

async function PrefetchedProductList({
  searchParams,
}: ProductsPageProps): Promise<JSX.Element> {
  await connection()
  const query = await loadProductListParamsAsync(searchParams)
  const queryClient = getServerQueryClient()
  await queryClient.prefetchQuery(productListQueryOptions(query))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListContent />
    </HydrationBoundary>
  )
}
