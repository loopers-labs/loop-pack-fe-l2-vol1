import type { ComponentProps } from 'react'

export type SelectContentProps = Omit<ComponentProps<'div'>, 'id' | 'role'>
