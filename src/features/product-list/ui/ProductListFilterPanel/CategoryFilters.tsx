import { For } from '@ilokesto/utilinent'
import { tv } from 'tailwind-variants'

import { PRODUCT_LIST_CATEGORIES } from '../../config'
import type { ProductListCategoryFilter } from '../../model'

type CategoryFiltersProps = {
  readonly category: ProductListCategoryFilter
  readonly onCategoryChange: (category: ProductListCategoryFilter) => void
}

type ProductListCategoryFilterOption = {
  readonly label: string
  readonly value: ProductListCategoryFilter
}

const filterLabelClassName = 'text-[13px] font-semibold text-[#444]'
const categoryButton = tv({
  base: 'cursor-pointer rounded-2xl border border-[#ddd] bg-white px-3 py-1.5 text-[13px]',
  variants: {
    active: {
      false: '',
      true: 'border-[#111] bg-[#111] text-white',
    },
  },
  defaultVariants: {
    active: false,
  },
})

const CATEGORY_LABEL_BY_VALUE: Record<ProductListCategoryFilter, string> = {
  all: '전체',
  beauty: '뷰티',
  electronics: '전자제품',
  fashion: '패션',
  home: '홈',
}

const PRODUCT_LIST_CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: CATEGORY_LABEL_BY_VALUE.all },
  ...PRODUCT_LIST_CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABEL_BY_VALUE[category],
  })),
] satisfies ReadonlyArray<ProductListCategoryFilterOption>

export function CategoryFilters({
  category,
  onCategoryChange,
}: CategoryFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={filterLabelClassName}>카테고리</span>
      <div className="flex flex-wrap gap-1.5">
        <For each={PRODUCT_LIST_CATEGORY_FILTER_OPTIONS}>
          {(cat) => (
            <button
              type="button"
              key={cat.value}
              className={categoryButton({ active: category === cat.value })}
              onClick={() => {
                onCategoryChange(cat.value)
              }}
            >
              {cat.label}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
