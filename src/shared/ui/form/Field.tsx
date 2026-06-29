import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type FieldProps = ComponentProps<'div'>

export function Field({ className, ...fieldProps }: FieldProps) {
  return <div {...fieldProps} className={cn('grid gap-1.5', className)} />
}
