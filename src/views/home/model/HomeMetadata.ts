import type { QueryClient } from '@tanstack/react-query'
import type { Metadata, ResolvingMetadata } from 'next'

import { ProductServerFetchError } from '@/entities/product/api/ProductServerFetchError'
import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import type { HomeResponse } from '@/entities/product/model/types'
import { ApiClientError } from '@/shared/api/ApiClientError'
import type { AppOrigin } from '@/shared/config/AppOrigin'
import {
  createPageOpenGraph,
  SITE_METADATA,
} from '@/shared/config/SiteMetadata'

export type HomeMetadataInput = Readonly<{
  origin: AppOrigin
  diagnosticScenario: DiagnosticScenario
  parent: ResolvingMetadata
}>

export type HomeMetadataDependencies = Readonly<{
  getQueryClient: () => QueryClient
  loadHome: (
    client: QueryClient,
    scenario: DiagnosticScenario,
    origin: AppOrigin,
  ) => Promise<HomeResponse>
}>

export async function buildHomeMetadata(
  input: HomeMetadataInput,
  dependencies: HomeMetadataDependencies,
): Promise<Metadata> {
  const parent = await input.parent
  const queryClient = dependencies.getQueryClient()
  let data: HomeResponse

  try {
    data = await dependencies.loadHome(
      queryClient,
      input.diagnosticScenario,
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

  const pageUrl = new URL('/', `${input.origin}/`).href
  const imageUrl = new URL(data.banner.image, `${input.origin}/`).href

  return {
    title: {
      absolute: `${data.banner.title} | ${SITE_METADATA.title}`,
    },
    description: data.banner.description,
    alternates: { canonical: pageUrl },
    openGraph: createPageOpenGraph(parent.openGraph, {
      title: data.banner.title,
      description: data.banner.description,
      url: pageUrl,
      images: [{ url: imageUrl }],
    }),
  }
}
