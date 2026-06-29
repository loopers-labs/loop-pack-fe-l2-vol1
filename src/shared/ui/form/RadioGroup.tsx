import type { ComponentProps, ReactNode } from 'react'
import { cn } from 'tailwind-variants'

type RadioGroupProps = ComponentProps<'fieldset'> & {
  legend: ReactNode
  legendClassName?: string
}

export function RadioGroup({
  children,
  className,
  legend,
  legendClassName,
  ...fieldsetProps
}: RadioGroupProps) {
  return (
    <fieldset
      {...fieldsetProps}
      className={cn('m-0 min-w-0 border-0 p-0', className)}
    >
      <legend
        className={cn(
          'mb-1 text-sm font-medium text-(--text-h)',
          legendClassName,
        )}
      >
        {legend}
      </legend>
      {children}
    </fieldset>
  )
}
