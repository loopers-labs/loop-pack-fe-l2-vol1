'use client'

import {
  categoryOptions,
  parseCategory,
  parseSort,
  sortOptions,
} from '@/entities/product/model/ProductQuerySchema'
import type { ProductFilters } from '@/features/product-filter/model/useProductFilters'
import { DebouncedInput } from '@/shared/ui/DebouncedInput'

export function FilterBar({
  filters,
  totalCount,
  pageSize,
  updateFilter,
  updatePage,
}: {
  filters: ProductFilters
  totalCount: number
  pageSize: number
  updateFilter: (
    patch: Partial<Pick<ProductFilters, 'q' | 'category' | 'sort'>>,
  ) => void
  updatePage: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <DebouncedInput
        key={filters.q}
        initialValue={filters.q}
        label="검색"
        name="q"
        placeholder="상품명 또는 브랜드"
        onDebouncedChange={(value) => {
          updateFilter({ q: value })
        }}
      />
      <label className="flex flex-col gap-1">
        <span className="text-xs text-(--color-subtle)">카테고리</span>
        <select
          name="category"
          value={filters.category}
          onChange={(e) => {
            updateFilter({ category: parseCategory(e.target.value) })
          }}
          className="min-h-10 rounded border border-(--color-border) px-3 py-2 text-sm text-(--color-text)"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-(--color-subtle)">정렬</span>
        <select
          name="sort"
          value={filters.sort}
          onChange={(e) => {
            updateFilter({ sort: parseSort(e.target.value) })
          }}
          className="min-h-10 rounded border border-(--color-border) px-3 py-2 text-sm text-(--color-text)"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <nav aria-label="페이지 이동" className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            updatePage(Math.max(1, filters.page - 1))
          }}
          disabled={filters.page <= 1}
          className="rounded border border-(--color-border) px-3 py-2 text-sm text-(--color-text) disabled:opacity-40"
        >
          이전
        </button>
        <span className="text-sm text-(--color-muted)">
          {String(filters.page)} / {String(totalPages)}
        </span>
        <button
          type="button"
          onClick={() => {
            updatePage(filters.page + 1)
          }}
          disabled={filters.page >= totalPages}
          className="rounded border border-(--color-border) px-3 py-2 text-sm text-(--color-text) disabled:opacity-40"
        >
          다음
        </button>
      </nav>
    </form>
  )
}
