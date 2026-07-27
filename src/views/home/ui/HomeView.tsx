'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { productEntity } from '@/entities/product/api/ProductService'
import type { Category } from '@/entities/product/model/types'
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

export function HomeView() {
  const { data, isPending, isError, error } = useQuery(productEntity.getHome())

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {isPending ? (
        <div className="py-20 text-center text-(--color-muted)">
          홈 데이터를 불러오는 중…
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-(--color-muted)">
          {error instanceof Error
            ? error.message
            : '홈 데이터를 불러오지 못했습니다.'}
        </div>
      ) : (
        <>
          <section className="flex min-h-56 flex-col justify-end gap-2 rounded-lg bg-(--color-surface-soft) p-8">
            <p className="text-sm text-(--color-muted)">
              {data.banner.description}
            </p>
            <h1 className="text-2xl font-extrabold text-(--color-ink)">
              {data.banner.title}
            </h1>
          </section>

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
    </main>
  )
}
