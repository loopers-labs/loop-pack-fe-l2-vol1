import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const heading = tv({
  base: 'font-(family-name:--heading) font-medium text-(--text-h)',
  variants: {
    variant: {
      dialog: 'm-0 mb-2.5 text-xl leading-[118%]',
      page: 'my-2 mb-5 text-[26px] leading-[118%] tracking-[-0.5px]',
      section: 'm-0 mb-3 text-[15px] leading-[118%] tracking-normal',
    },
  },
})

type HeadingVariants = VariantProps<typeof heading>

type HeadingProps<T extends 'h1' | 'h2' | 'h3'> = ComponentProps<T> &
  HeadingVariants

function H1({
  children,
  className,
  variant = 'page',
  ...headingProps
}: HeadingProps<'h1'>) {
  return (
    <h1 {...headingProps} className={heading({ className, variant })}>
      {children}
    </h1>
  )
}

function H2({
  children,
  className,
  variant = 'section',
  ...headingProps
}: HeadingProps<'h2'>) {
  return (
    <h2 {...headingProps} className={heading({ className, variant })}>
      {children}
    </h2>
  )
}

function H3({
  children,
  className,
  variant = 'dialog',
  ...headingProps
}: HeadingProps<'h3'>) {
  return (
    <h3 {...headingProps} className={heading({ className, variant })}>
      {children}
    </h3>
  )
}

export const Heading = Object.assign(
  {},
  {
    H1,
    H2,
    H3,
  },
)
