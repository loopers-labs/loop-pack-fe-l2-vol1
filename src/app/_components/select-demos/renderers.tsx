import type { SelectOptionRenderState } from '@/shared/ui/select/types'

import { getOptionFrameClassName, productThumbnailClassName } from './styles'
import type {
  OptionVisualState,
  ProductSelectOption,
  SizeSelectOption,
  TextSelectOption,
} from './types'

function ProductThumbnail({
  option,
  size,
}: {
  readonly option: ProductSelectOption
  readonly size: string
}) {
  return (
    <span aria-hidden="true" className={`${productThumbnailClassName} ${size}`}>
      {option.thumbnailText}
    </span>
  )
}

function getProductStatusLabel({ disabled, selected }: OptionVisualState) {
  if (selected) {
    return '선택됨'
  }

  if (disabled) {
    return '품절'
  }

  return '선택 가능'
}

function getAvailableLabel(
  disabled: boolean,
  unavailableLabel: string,
  availableLabel: string,
) {
  if (disabled) {
    return unavailableLabel
  }

  return availableLabel
}

export function renderTextValue(option: TextSelectOption) {
  return (
    <span className="grid min-w-0 gap-1">
      <span className="truncate font-semibold">{option.label}</span>
      <span className="text-xs text-[#5a6675]">{option.tone}</span>
    </span>
  )
}

export function renderTextOption({
  disabled,
  highlighted,
  option,
  selected,
}: SelectOptionRenderState<TextSelectOption>) {
  return (
    <div
      className={getOptionFrameClassName({ disabled, highlighted, selected })}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 break-keep">
          <span className="block font-semibold">{option.label}</span>
          <span className="mt-1 block text-xs leading-5">
            {option.description}
          </span>
        </span>
        <span className="rounded-full border border-current px-2 py-0.5 text-[11px] tracking-wide uppercase">
          {getAvailableLabel(disabled, 'Unavailable', option.tone)}
        </span>
      </div>
    </div>
  )
}

export function renderSizeValue(option: SizeSelectOption) {
  return (
    <span className="grid min-w-0 gap-1">
      <span className="truncate font-semibold">{option.label}</span>
      <span className="text-xs text-[#5a6675]">{option.fit}</span>
    </span>
  )
}

export function renderSizeOption({
  disabled,
  highlighted,
  option,
  selected,
}: SelectOptionRenderState<SizeSelectOption>) {
  return (
    <div
      className={getOptionFrameClassName({ disabled, highlighted, selected })}
    >
      <span className="flex items-center justify-between gap-3">
        <span>
          <span className="block font-semibold">{option.label}</span>
          <span className="mt-1 block text-xs leading-5">
            {option.sizeGuide}
          </span>
        </span>
        <span className="text-xs font-medium">
          {getAvailableLabel(disabled, '재입고 대기', option.fit)}
        </span>
      </span>
    </div>
  )
}

export function renderProductValue(option: ProductSelectOption) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <ProductThumbnail option={option} size="size-9" />
      <span className="grid min-w-0 gap-1">
        <span className="truncate font-semibold">{option.label}</span>
        <span className="text-xs text-[#5a6675]">{option.price}</span>
      </span>
    </span>
  )
}

export function renderProductOption({
  disabled,
  highlighted,
  option,
  selected,
}: SelectOptionRenderState<ProductSelectOption>) {
  return (
    <div
      className={getOptionFrameClassName({ disabled, highlighted, selected })}
    >
      <div className="flex items-center gap-3">
        <ProductThumbnail option={option} size="size-10" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{option.label}</span>
          <span className="mt-1 block text-xs leading-5">
            {option.price} / {option.shippingNote}
          </span>
        </span>
        <span className="text-xs font-medium">
          {getProductStatusLabel({ disabled, highlighted, selected })}
        </span>
      </div>
    </div>
  )
}
