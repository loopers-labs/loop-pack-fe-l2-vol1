import type { ComponentProps } from 'react'
import { cn } from 'tailwind-variants'

type ModalProps = ComponentProps<'div'> & {
  headingId: string
}

export function Modal({
  children,
  className,
  headingId,
  ...modalProps
}: ModalProps) {
  return (
    <div
      {...modalProps}
      aria-labelledby={headingId}
      aria-modal="true"
      className={cn(
        'fixed inset-0 flex items-center justify-center bg-black/45 p-5',
        className,
      )}
      role="dialog"
    >
      <div className="max-w-90 rounded-xl bg-(--bg) p-5 text-left text-(--text)">
        {children}
      </div>
    </div>
  )
}
