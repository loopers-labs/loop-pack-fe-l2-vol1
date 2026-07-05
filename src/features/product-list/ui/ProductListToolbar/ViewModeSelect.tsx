import { For } from '@ilokesto/utilinent'
import type { ChangeEventHandler } from 'react'

import { PRODUCT_LIST_VIEW_MODES } from '../../config'
import type { ProductListViewMode } from '../../model'

type ViewModeSelectProps = {
  readonly onViewModeChange: ChangeEventHandler<HTMLSelectElement>
  readonly viewMode: ProductListViewMode
}

type ProductListViewModeOption = {
  readonly label: string
  readonly value: ProductListViewMode
}

const selectClassName =
  'rounded-md border border-[#ddd] bg-white px-3.5 py-2.5 text-sm'

const VIEW_MODE_LABEL_BY_VALUE: Record<ProductListViewMode, string> = {
  grid: '그리드',
  list: '리스트',
}

const PRODUCT_LIST_VIEW_MODE_SELECT_OPTIONS = PRODUCT_LIST_VIEW_MODES.map(
  (viewMode) => ({
    value: viewMode,
    label: VIEW_MODE_LABEL_BY_VALUE[viewMode],
  }),
) satisfies ReadonlyArray<ProductListViewModeOption>

export function ViewModeSelect({
  onViewModeChange,
  viewMode,
}: ViewModeSelectProps) {
  return (
    <select
      aria-label="보기 방식"
      className={selectClassName}
      value={viewMode}
      onChange={onViewModeChange}
    >
      <For each={PRODUCT_LIST_VIEW_MODE_SELECT_OPTIONS}>
        {(option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )}
      </For>
    </select>
  )
}
