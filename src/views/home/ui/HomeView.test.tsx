import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { ProductQueryKeyFactory } from '@/entities/product/model/ProductQueryKeyFactory'
import type { HomeResponse } from '@/entities/product/model/types'

import { HomeView } from './HomeView'

describe('HomeView successful data content', () => {
  it('renders the data sections without duplicating the page shell', () => {
    const diagnosticScenario: DiagnosticScenario = { scenario: 'slow' }
    const homeResponse: HomeResponse = {
      banner: {
        title: '매일 새롭게 발견하는 취향',
        description: '지금 가장 사랑받는 상품을 만나보세요.',
        image: '/images/week-07/hero-original.jpg',
      },
      categories: [],
      popularProducts: [],
      newProducts: [],
    }
    const queryClient = new QueryClient()
    queryClient.setQueryData(
      ProductQueryKeyFactory.home(diagnosticScenario),
      homeResponse,
    )

    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <HomeView diagnosticScenario={diagnosticScenario} />
      </QueryClientProvider>,
    )

    expect(markup).not.toContain('<main')
    expect(markup).not.toContain('<h1')
    expect(markup).toContain('<h2 id="week07-hero-title"')
    expect(markup).toContain('매일 새롭게 발견하는 취향')
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.')
    expect(markup).toContain('alt=""')
    expect(markup).toContain(
      'sizes="(max-width: 640px) calc(222.2222vw - 106.6667px), (max-width: 1152px) calc(100vw - 48px), 1104px"',
    )
    expect(markup).toContain(
      'srcSet="/_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg',
    )
    expect(markup).not.toContain('<link rel="preload"')
    expect(markup).not.toContain('fetchPriority="high"')
    expect(markup).toContain('카테고리')
    expect(markup).toContain('인기 상품')
    expect(markup).toContain('신상품')
  })
})
