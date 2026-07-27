'use client'

import {
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'

import {
  categorySchema,
  sortSchema,
} from '@/entities/product/model/ProductQuerySchema'

export const productFilterParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringEnum(categorySchema.options).withDefault('all'),
  sort: parseAsStringEnum(sortSchema.options).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
} as const

export type ProductFilters = inferParserType<typeof productFilterParsers>

export type ProductFilterPatch = Partial<
  Pick<ProductFilters, 'q' | 'category' | 'sort'>
>

export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(productFilterParsers, {
    history: 'push',
  })

  const updateFilter = (patch: ProductFilterPatch) => {
    void setFilters({
      ...patch,
      page: 1,
    })
  }

  const updatePage = (page: number) => {
    void setFilters({ page })
  }

  return {
    filters,
    updateFilter,
    updatePage,
  }
}
