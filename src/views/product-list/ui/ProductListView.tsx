'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { productEntity } from '@/entities/product/api/ProductService'
import { DEFAULT_PAGE_SIZE } from '@/entities/product/model/ProductQuerySchema'
import { useProductFilters } from '@/features/product-filter/model/useProductFilters'
import { FilterBar } from '@/features/product-filter/ui/FilterBar'
import { ProductListSection } from '@/widgets/product-list/ui/ProductListSection'

export function ProductListView() {
  const { filters, updateFilter, updatePage } = useProductFilters()
  const productListQueryInput = {
    ...filters,
    pageSize: DEFAULT_PAGE_SIZE,
  }
  const productListScope = JSON.stringify(productListQueryInput)

  const productListQuery = useQuery(
    productEntity.getProductList(productListQueryInput),
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-(--color-ink)">
        상품 목록
      </h1>

      <section className="mb-6">
        <FilterBar
          filters={filters}
          totalCount={productListQuery.data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          updateFilter={updateFilter}
          updatePage={updatePage}
        />
      </section>

      <ProductListSection query={productListQuery} scope={productListScope} />

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm text-(--color-text) hover:text-(--color-ink)"
        >
          ← 홈으로
        </Link>
      </div>
    </main>
  )
}
