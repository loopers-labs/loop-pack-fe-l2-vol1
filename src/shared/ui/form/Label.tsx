import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type LabelProps = ComponentProps<'label'>

export function Label({ className, htmlFor, ...labelProps }: LabelProps) {
  return (
    <label
      {...labelProps}
      htmlFor={htmlFor}
      className={cn('flex items-center gap-2 py-1 text-sm', className)}
    />
  )
}
