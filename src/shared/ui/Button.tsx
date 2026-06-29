import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const button = tv({
  base: 'cursor-pointer rounded-lg border border-(--border) bg-(--bg) px-3.5 py-2.5 font-[inherit] text-sm text-(--text-h) disabled:cursor-not-allowed disabled:opacity-45',
  variants: {
    variant: {
      default: '',
      link: 'border-0 bg-transparent p-1 text-(--accent)',
      primary:
        'border-0 bg-(--accent) font-semibold text-white hover:brightness-95',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>

export function Button({ className, variant, ...buttonProps }: ButtonProps) {
  return <button {...buttonProps} className={button({ className, variant })} />
}
