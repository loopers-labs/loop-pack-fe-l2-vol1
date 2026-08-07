import type { QueryClient } from '@tanstack/react-query'
import type { Metadata, ResolvingMetadata } from 'next'

import { ProductServerFetchError } from '@/entities/product/api/ProductServerFetchError'
import type { ProductListRequest } from '@/entities/product/model/ProductListRequest'
import { ProductListRouteParams } from '@/entities/product/model/ProductListRouteParams'
import {
  categoryOptions,
  sortOptions,
} from '@/entities/product/model/ProductQuerySchema'
import type { ProductListResponse } from '@/entities/product/model/types'
import { ApiClientError } from '@/shared/api/ApiClientError'
import type { AppOrigin } from '@/shared/config/AppOrigin'
import {
  createPageOpenGraph,
  SITE_METADATA,
} from '@/shared/config/SiteMetadata'

export type ProductListMetadataInput = Readonly<{
  origin: AppOrigin
  request: ProductListRequest
  parent: ResolvingMetadata
}>

export type ProductListMetadataDependencies = Readonly<{
  getQueryClient: () => QueryClient
  loadProductList: (
    client: QueryClient,
    request: ProductListRequest,
    origin: AppOrigin,
  ) => Promise<ProductListResponse>
}>

export async function buildProductListMetadata(
  input: ProductListMetadataInput,
  dependencies: ProductListMetadataDependencies,
): Promise<Metadata> {
  const parent = await input.parent
  const queryClient = dependencies.getQueryClient()
  let data: ProductListResponse

  try {
    data = await dependencies.loadProductList(
      queryClient,
      input.request,
      input.origin,
    )
  } catch (error) {
    if (
      error instanceof ApiClientError ||
      error instanceof ProductServerFetchError
    ) {
      return {}
    }
    throw error
  }

  const categoryLabel =
    categoryOptions.find(({ value }) => value === input.request.category)
      ?.label ?? input.request.category
  const sortLabel =
    sortOptions.find(({ value }) => value === input.request.sort)?.label ??
    input.request.sort
  const baseTitle =
    input.request.q !== ''
      ? `“${input.request.q}” 검색 결과`
      : input.request.category !== 'all'
        ? `${categoryLabel} 상품`
        : '상품 목록'
  const title =
    input.request.page >= 2
      ? `${baseTitle} - ${String(input.request.page)}페이지`
      : baseTitle

  let description: string
  if (data.totalCount === 0) {
    description =
      input.request.q !== ''
        ? `“${input.request.q}” 검색 결과가 0개입니다.`
        : `${categoryLabel} 조건의 상품이 0개입니다.`
  } else if (data.products.length === 0) {
    description = `전체 ${String(data.totalCount)}개 중 ${String(input.request.page)}페이지에 표시할 상품이 없습니다.`
  } else {
    description =
      input.request.q !== ''
        ? `“${input.request.q}” 검색 결과 ${String(data.totalCount)}개를 ${sortLabel}으로 확인하세요.`
        : `${categoryLabel} 상품 ${String(data.totalCount)}개를 ${sortLabel}으로 확인하세요.`
  }

  const pageUrl = new URL('/products', `${input.origin}/`)
  pageUrl.search = ProductListRouteParams.canonicalSearchParams(
    input.request,
  ).toString()
  const imagePath = data.products[0]?.image ?? SITE_METADATA.fallbackImagePath
  const imageUrl = new URL(imagePath, `${input.origin}/`).href

  return {
    title,
    description,
    alternates: { canonical: pageUrl.href },
    openGraph: createPageOpenGraph(parent.openGraph, {
      title,
      description,
      url: pageUrl.href,
      images: [{ url: imageUrl }],
    }),
  }
}
