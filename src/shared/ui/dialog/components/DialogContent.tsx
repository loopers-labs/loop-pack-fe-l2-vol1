import type { ComponentProps } from 'react'

import { useDialogContext } from '../lib/DialogContext'
import { DialogPortal } from './DialogPortal'

type DialogContentProps = ComponentProps<'div'>

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
      <div {...contentProps}>{children}</div>
    </DialogPortal>
  )
}
