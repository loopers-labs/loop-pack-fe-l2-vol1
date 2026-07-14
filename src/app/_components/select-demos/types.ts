import type { SelectOption } from '@/shared/ui/select/types'

export type TextSelectOption = SelectOption & {
  readonly description: string
  readonly tone: string
}

export type SizeSelectOption = SelectOption & {
  readonly fit: string
  readonly sizeGuide: string
}

export type ProductSelectOption = SelectOption & {
  readonly price: string
  readonly shippingNote: string
  readonly thumbnailText: string
}

export type OptionVisualState = {
  readonly disabled: boolean
  readonly highlighted: boolean
  readonly selected: boolean
}
