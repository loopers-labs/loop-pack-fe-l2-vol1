'use client'

import {
  createParser,
  type inferParserType,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'

import {
  categorySchema,
  pageSchema,
  sortSchema,
} from '@/entities/product/model/ProductQuerySchema'

const pageParser = createParser({
  parse: (query: string) => {
    const parsedPage = pageSchema.safeParse(Number(query))
    return parsedPage.success ? parsedPage.data : null
  },
  serialize: (value: number) => String(value),
}).withDefault(1)

export const productFilterParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringEnum(categorySchema.options).withDefault('all'),
  sort: parseAsStringEnum(sortSchema.options).withDefault('latest'),
  page: pageParser,
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
