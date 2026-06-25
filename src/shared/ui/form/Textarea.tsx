import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

import { textControl } from './formStyles'

type TextareaProps = ComponentProps<'textarea'>

export function Textarea({ className, ...textareaProps }: TextareaProps) {
  return (
    <textarea
      {...textareaProps}
      className={textControl({
        className: cn('min-h-15 resize-y py-2', className),
      })}
    />
  )
}
