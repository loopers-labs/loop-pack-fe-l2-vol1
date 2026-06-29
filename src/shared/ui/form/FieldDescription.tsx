import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type FieldDescriptionProps = ComponentProps<'p'>

export function FieldDescription({
  className,
  ...descriptionProps
}: FieldDescriptionProps) {
  return (
    <p
      {...descriptionProps}
      className={cn('m-0 text-[13px] text-(--text)', className)}
    />
  )
}
