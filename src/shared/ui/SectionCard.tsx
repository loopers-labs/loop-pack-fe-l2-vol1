import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type SectionCardProps = ComponentProps<'div'>

export function SectionCard({ className, ...sectionProps }: SectionCardProps) {
  return (
    <div
      {...sectionProps}
      className={cn(
        'mb-3.5 rounded-xl border border-(--border) p-4',
        className,
      )}
    />
  )
}
