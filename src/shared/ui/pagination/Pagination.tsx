import { For } from '@ilokesto/utilinent'

import { getPaginationItems } from './getPaginationItems'

const DEFAULT_SIBLING_COUNT = 2

type PaginationProps = {
  readonly currentPage: number
  readonly totalCount: number
  readonly pageSize: number
  readonly onPageChange: (nextPage: number) => void
  readonly siblingCount?: number
}

export function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  siblingCount = DEFAULT_SIBLING_COUNT,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  if (totalPages <= 1) {
    return null
  }

  const paginationItems = getPaginationItems({
    currentPage,
    totalPages,
    siblingCount,
  })

  return (
    <nav className="mb-6 flex justify-center gap-1">
      <For each={paginationItems}>
        {(item) => (
          <button
            type="button"
            key={`${item.ariaLabel}-${String(item.value)}`}
            className={item.className}
            value={item.value}
            onClick={(e) => {
              onPageChange(Number(e.currentTarget.value))
            }}
            disabled={item.disabled}
            aria-label={item.ariaLabel}
          >
            {item.children}
          </button>
        )}
      </For>
    </nav>
  )
}
