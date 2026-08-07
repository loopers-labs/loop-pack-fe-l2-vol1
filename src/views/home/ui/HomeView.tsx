'use client'

import {
  ErrorBoundary,
  type ErrorBoundaryFallbackProps,
} from '@suspensive/react'
import { SuspenseQuery } from '@suspensive/react-query'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import Link from 'next/link'

import { productEntity } from '@/entities/product/api/ProductService'
import { type DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import type { Category } from '@/entities/product/model/types'
import { HeroSection } from '@/examples/week-07-performance/HeroSection'
import { InlineQueryError } from '@/shared/ui/InlineQueryError'
import { ProductGrid } from '@/widgets/product-list/ui/ProductGrid'

function CategoryLinks({ categories }: { categories: Array<Category> }) {
  return (
    <nav aria-label="카테고리" className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.id}`}
          className="rounded border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-muted)"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  )
}

type HomeViewProps = {
  readonly diagnosticScenario: DiagnosticScenario
}

function HomeQueryErrorFallback({ error, reset }: ErrorBoundaryFallbackProps) {
  return (
    <InlineQueryError
      message={error.message}
      isRetrying={false}
      onRetry={reset}
    />
  )
}

export function HomeHeroFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative flex [aspect-ratio:16/9] w-full items-center justify-center overflow-hidden bg-(--color-surface-muted) text-sm text-(--color-muted) [@media(max-width:640px)]:[aspect-ratio:4/5]"
    >
      홈 데이터를 불러오는 중…
    </div>
  )
}

export function HomeView({ diagnosticScenario }: HomeViewProps) {
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  return (
    <ErrorBoundary
      fallback={HomeQueryErrorFallback}
      onReset={queryErrorResetBoundary.reset}
      resetKeys={[diagnosticScenario.scenario]}
    >
      <SuspenseQuery {...productEntity.getHome(diagnosticScenario)}>
        {({ data }) => (
          <>
            <HeroSection
              title={data.banner.title}
              description={data.banner.description}
            />

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-(--color-ink)">
                카테고리
              </h2>
              <CategoryLinks categories={data.categories} />
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-(--color-ink)">
                인기 상품
              </h2>
              <ProductGrid
                products={data.popularProducts}
                emptyMessage="표시할 상품이 없습니다."
              />
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-(--color-ink)">
                신상품
              </h2>
              <ProductGrid
                products={data.newProducts}
                emptyMessage="표시할 상품이 없습니다."
              />
            </section>
          </>
        )}
      </SuspenseQuery>
    </ErrorBoundary>
  )
}
