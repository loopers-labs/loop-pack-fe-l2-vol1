import type { OptionVisualState } from './types'

export const triggerClassName =
  'flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#d8d2c3] bg-[#fffdf6] px-4 py-3 text-left text-sm text-[#18212e] shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08060d]'

export const contentClassName =
  'mt-2 grid max-h-80 gap-2 overflow-y-auto rounded-xl border border-[#d8d2c3] bg-[#fffdf6] p-2 shadow-sm [&[popover]:not(:popover-open)]:hidden [&:popover-open]:fixed [&:popover-open]:inset-auto [&:popover-open]:m-[8px_0] [&:popover-open]:w-[anchor-size(width)] [&:popover-open]:[position-area:block-end] [&:popover-open]:[position-try-fallbacks:flip-block]'

export const productThumbnailClassName =
  'grid shrink-0 place-items-center rounded-lg bg-[#18212e] text-xs font-bold text-[#fffdf6]'

export function getOptionFrameClassName({
  disabled,
  highlighted,
  selected,
}: OptionVisualState) {
  const selectedClassName = selected ? 'ring-1 ring-[#08060d]/20' : ''

  if (disabled) {
    return `rounded-lg border border-dashed border-[#d8d2c3] bg-[#f4f3ec] p-3 text-[#8794a3] opacity-70 ${selectedClassName}`
  }

  if (highlighted) {
    return `rounded-lg border border-[#08060d] bg-[#f4f3ec] p-3 text-[#08060d] ${selectedClassName}`
  }

  return `rounded-lg border border-transparent p-3 text-[#18212e] transition-colors hover:border-[#d8d2c3] hover:bg-[#f8f7f0] ${selectedClassName}`
}
