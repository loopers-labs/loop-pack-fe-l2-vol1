import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type LabelProps = Omit<ComponentProps<'label'>, 'htmlFor'> & {
  htmlFor: string
}

export function Label({ className, htmlFor, ...labelProps }: LabelProps) {
  return (
    <label
      {...labelProps}
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-(--text-h)', className)}
    />
  )
}
