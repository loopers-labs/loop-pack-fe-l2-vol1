import type { ChangeEventHandler } from 'react'

import {
  type ProductListSortBy,
  type ProductListViewMode,
  SearchInput,
  SortSelect,
  ViewModeSelect,
} from '@/features/product-list'

type ProductListToolbarProps = {
  readonly onSearchChange: (searchQuery: string) => void
  readonly onSortChange: ChangeEventHandler<HTMLSelectElement>
  readonly onViewModeChange: ChangeEventHandler<HTMLSelectElement>
  readonly searchQuery: string
  readonly sortBy: ProductListSortBy
  readonly syncKey: number
  readonly viewMode: ProductListViewMode
}

export function ProductListToolbar({
  onSearchChange,
  onSortChange,
  onViewModeChange,
  searchQuery,
  sortBy,
  syncKey,
  viewMode,
}: ProductListToolbarProps) {
  return (
    <section className="mb-6 flex gap-3">
      <SearchInput
        searchQuery={searchQuery}
        syncKey={syncKey}
        onSearchChange={onSearchChange}
      />
      <SortSelect sortBy={sortBy} onSortChange={onSortChange} />
      <ViewModeSelect viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </section>
  )
}
