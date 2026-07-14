import type { ComponentProps, ReactNode } from 'react'

import type { SelectOption } from './SelectOption'
import type { SelectOptionRenderState } from './SelectOptionRenderState'

export type SelectItemProps<TOption extends SelectOption> = Omit<
  ComponentProps<'div'>,
  | 'aria-disabled'
  | 'aria-selected'
  | 'children'
  | 'data-disabled'
  | 'data-highlighted'
  | 'data-selected'
  | 'id'
  | 'role'
> & {
  readonly children?: (state: SelectOptionRenderState<TOption>) => ReactNode
  readonly option: TOption
}
