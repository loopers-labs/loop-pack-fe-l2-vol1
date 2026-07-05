import { For } from '@ilokesto/utilinent'
import type { ChangeEventHandler } from 'react'

import { PRODUCT_LIST_SORT_OPTIONS } from '../../config'
import type { ProductListSortBy } from '../../model'

type SortSelectProps = {
  readonly onSortChange: ChangeEventHandler<HTMLSelectElement>
  readonly sortBy: ProductListSortBy
}

type ProductListSortOption = {
  readonly label: string
  readonly value: ProductListSortBy
}

const selectClassName =
  'rounded-md border border-[#ddd] bg-white px-3.5 py-2.5 text-sm'

const SORT_LABEL_BY_VALUE: Record<ProductListSortBy, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '가격 낮은순',
  'price-desc': '가격 높은순',
}

const PRODUCT_LIST_SORT_SELECT_OPTIONS = PRODUCT_LIST_SORT_OPTIONS.map(
  (sortOption) => ({
    value: sortOption,
    label: SORT_LABEL_BY_VALUE[sortOption],
  }),
) satisfies ReadonlyArray<ProductListSortOption>

export function SortSelect({ onSortChange, sortBy }: SortSelectProps) {
  return (
    <select
      aria-label="정렬 방식"
      className={selectClassName}
      value={sortBy}
      onChange={onSortChange}
    >
      <For each={PRODUCT_LIST_SORT_SELECT_OPTIONS}>
        {(opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )}
      </For>
    </select>
  )
}
