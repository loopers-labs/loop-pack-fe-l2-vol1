import type { ChangeEventHandler } from 'react'

type InStockToggleProps = {
  readonly inStockOnly: boolean
  readonly onInStockToggle: ChangeEventHandler<HTMLInputElement>
}

const filterLabelClassName = 'text-[13px] font-semibold text-[#444]'

export function InStockToggle({
  inStockOnly,
  onInStockToggle,
}: InStockToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={filterLabelClassName}>옵션</span>
      <label className="flex items-center gap-1.5 text-[13px] font-normal">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={onInStockToggle}
        />
        재고 있는 것만
      </label>
    </div>
  )
}
