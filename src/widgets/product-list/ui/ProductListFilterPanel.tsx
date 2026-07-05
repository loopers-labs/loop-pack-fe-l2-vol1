import type { ChangeEventHandler } from 'react'

import {
  CategoryFilters,
  InStockToggle,
  PriceRangeFields,
  type ProductListCategoryFilter,
  ResetFiltersButton,
} from '@/features/product-list'

type ProductListFilterPanelProps = {
  readonly category: ProductListCategoryFilter
  readonly inStockOnly: boolean
  readonly maxPrice: string
  readonly minPrice: string
  readonly onCategoryChange: (category: ProductListCategoryFilter) => void
  readonly onInStockToggle: ChangeEventHandler<HTMLInputElement>
  readonly onMaxPriceChange: (maxPrice: string) => void
  readonly onMinPriceChange: (minPrice: string) => void
  readonly onResetFilters: () => void
  readonly syncKey: number
}

export function ProductListFilterPanel({
  category,
  inStockOnly,
  maxPrice,
  minPrice,
  onCategoryChange,
  onInStockToggle,
  onMaxPriceChange,
  onMinPriceChange,
  onResetFilters,
  syncKey,
}: ProductListFilterPanelProps) {
  return (
    <section className="mb-4 flex flex-wrap items-end gap-6 rounded-lg bg-[#f7f7f8] p-4">
      <CategoryFilters
        category={category}
        onCategoryChange={onCategoryChange}
      />
      <PriceRangeFields
        maxPrice={maxPrice}
        minPrice={minPrice}
        syncKey={syncKey}
        onMaxPriceChange={onMaxPriceChange}
        onMinPriceChange={onMinPriceChange}
      />
      <InStockToggle
        inStockOnly={inStockOnly}
        onInStockToggle={onInStockToggle}
      />
      <ResetFiltersButton onResetFilters={onResetFilters} />
    </section>
  )
}
