import type { SelectOption } from './SelectOption'

export type SelectOptionRenderState<TOption extends SelectOption> = {
  readonly option: TOption
  readonly selected: boolean
  readonly highlighted: boolean
  readonly disabled: boolean
}
