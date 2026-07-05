import { DebouncedInput } from '@/shared/ui'

type PriceRangeFieldsProps = {
  readonly maxPrice: string
  readonly minPrice: string
  readonly onMaxPriceChange: (maxPrice: string) => void
  readonly onMinPriceChange: (minPrice: string) => void
  readonly syncKey: number
}

const filterLabelClassName = 'text-[13px] font-semibold text-[#444]'
const priceInputClassName =
  'w-25 rounded-md border border-[#ddd] px-2.5 py-1.5 text-[13px]'

export function PriceRangeFields({
  maxPrice,
  minPrice,
  onMaxPriceChange,
  onMinPriceChange,
  syncKey,
}: PriceRangeFieldsProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={filterLabelClassName}>가격 범위</span>
      <div className="flex items-center gap-2">
        <DebouncedInput
          aria-label="최소 가격"
          type="number"
          placeholder="최소"
          syncKey={syncKey}
          value={minPrice}
          onValueChange={onMinPriceChange}
          min={0}
          className={priceInputClassName}
        />
        <span>~</span>
        <DebouncedInput
          aria-label="최대 가격"
          type="number"
          placeholder="최대"
          syncKey={syncKey}
          value={maxPrice}
          onValueChange={onMaxPriceChange}
          min={0}
          className={priceInputClassName}
        />
      </div>
    </div>
  )
}
