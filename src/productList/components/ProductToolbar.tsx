import type { SortBy } from '../types'

type SortOption = {
  value: SortBy
  label: string
}

type ViewMode = 'grid' | 'list'

type ProductToolbarProps = {
  searchQuery: string
  sortBy: SortBy
  sortOptions: SortOption[]
  viewMode: ViewMode
  onSearchChange: (value: string) => void
  onSortChange: (sortBy: SortBy) => void
  onViewModeChange: (viewMode: ViewMode) => void
}

export function ProductToolbar({
  searchQuery,
  sortBy,
  sortOptions,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
}: ProductToolbarProps) {
  return (
    <section className="search-sort">
      <input
        type="search"
        placeholder="상품 검색..."
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className="search-input"
      />
      <select
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as SortBy)}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={viewMode}
        onChange={(event) => onViewModeChange(event.target.value as ViewMode)}
      >
        <option value="grid">그리드</option>
        <option value="list">리스트</option>
      </select>
    </section>
  )
}
