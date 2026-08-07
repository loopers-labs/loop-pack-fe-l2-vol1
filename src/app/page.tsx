import { Suspense } from '@suspensive/react'
import { HydrationBoundary } from '@tanstack/react-query'
import type { Metadata, ResolvingMetadata } from 'next'

import { ProductServerService } from '@/entities/product/api/ProductServerService'
import { parseDiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { getAppOrigin } from '@/shared/config/getAppOrigin'
import { dehydratePendingQueries } from '@/shared/lib/dehydratePendingQueries'
import { getQueryClient } from '@/shared/lib/getQueryClient'
import { buildHomeMetadata } from '@/views/home/model/HomeMetadata'
import { HomeHeroFallback, HomeView } from '@/views/home/ui/HomeView'

type HomePageProps = {
  readonly searchParams: Promise<{
    readonly scenario?: string | Array<string>
  }>
}

function firstValue(value: string | Array<string> | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata(
  { searchParams }: HomePageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { scenario } = await searchParams
  const origin = getAppOrigin()
  const serverService = new ProductServerService()

  return buildHomeMetadata(
    {
      origin,
      diagnosticScenario: parseDiagnosticScenario(firstValue(scenario)),
      parent,
    },
    {
      getQueryClient,
      loadHome: (client, diagnosticScenario, appOrigin) =>
        client.fetchQuery(serverService.getHome(diagnosticScenario, appOrigin)),
    },
  )
}

export async function HomeHydration({ searchParams }: HomePageProps) {
  const { scenario } = await searchParams
  const diagnosticScenario = parseDiagnosticScenario(firstValue(scenario))
  const queryClient = getQueryClient()

  if (diagnosticScenario.scenario !== 'error') {
    const options = new ProductServerService().getHome(
      diagnosticScenario,
      getAppOrigin(),
    )
    void queryClient.prefetchQuery(options)
  }

  return (
    <HydrationBoundary state={dehydratePendingQueries(queryClient)}>
      <HomeView diagnosticScenario={diagnosticScenario} />
    </HydrationBoundary>
  )
}

export default function Home({ searchParams }: HomePageProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold text-(--color-ink)">
          Loopers Commerce
        </h1>
        <p className="mt-2 text-sm text-(--color-muted)">
          취향에 맞는 상품을 발견해보세요.
        </p>
      </header>

      <Suspense clientOnly fallback={<HomeHeroFallback />}>
        <HomeHydration searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
