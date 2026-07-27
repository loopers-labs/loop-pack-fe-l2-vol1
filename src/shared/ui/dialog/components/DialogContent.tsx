import type { ComponentProps } from 'react'

import { useDialogContext } from '../lib/DialogContext'
import { DialogPortal } from './DialogPortal'

type DialogContentProps = Omit<
  ComponentProps<'div'>,
  'aria-describedby' | 'aria-labelledby' | 'aria-modal' | 'role'
>

export function DialogContent({
  children,
  ...contentProps
}: DialogContentProps) {
  const dialog = useDialogContext('Content')

  if (!dialog.open) {
    return null
  }

  return (
    <DialogPortal>
      <div
        {...contentProps}
        aria-describedby={dialog.descriptionId}
        aria-labelledby={dialog.titleId}
        aria-modal="true"
        role="dialog"
      >
        {children}
      </div>
    </DialogPortal>
  )
}
