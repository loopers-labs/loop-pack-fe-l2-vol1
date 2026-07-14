import type { ComponentProps } from 'react'

export type SelectTriggerProps = Omit<
  ComponentProps<'button'>,
  | 'aria-activedescendant'
  | 'aria-controls'
  | 'aria-expanded'
  | 'aria-haspopup'
  | 'role'
  | 'type'
>
