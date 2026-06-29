import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type FieldErrorProps = ComponentProps<'p'>

export function FieldError({
  className,
  role = 'alert',
  ...errorProps
}: FieldErrorProps) {
  return (
    <p
      {...errorProps}
      className={cn('m-0 text-[13px] text-red-600', className)}
      role={role}
    />
  )
}
